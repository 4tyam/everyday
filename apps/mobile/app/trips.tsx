import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
	useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/context/auth-context";
import { ImageViewer } from "../src/components/calendar/image-viewer";
import { TripFolderCard } from "../src/components/trips/trip-folder-card";
import {
	compareDayKeys,
	formatDayKey,
	listDayKeysInRange,
	toLocalDayKey,
} from "../src/features/memories/day-key";
import type { DayKey, DayMemory } from "../src/features/memories/types";
import { useTripMemories, useTrips } from "../src/features/trips/use-trips";
import type { Trip } from "../src/features/trips/types";
import { getTheme } from "../src/theme/colors";

function mockColorFromUri(uri: string): string {
	let hash = 0;
	for (let i = 0; i < uri.length; i += 1) {
		hash = (hash << 5) - hash + uri.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 55%, 62%)`;
}

function buildFallbackTripName(startDayKey: DayKey, endDayKey: DayKey): string {
	const start = formatDayKey(startDayKey, { month: "short", day: "numeric" });
	const end = formatDayKey(endDayKey, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	return `Trip ${start} - ${end}`;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PAD = 16;
const GRID_GAP = 8;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - GRID_PAD * 2 - GRID_GAP) / 2;

export default function TripsTab() {
	const { user } = useAuth();
	const insets = useSafeAreaInsets();
	const colorScheme = useColorScheme();
	const theme = getTheme(colorScheme);
	const isDark = colorScheme === "dark";
	const [now, setNow] = useState(() => new Date());
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
	const [tripName, setTripName] = useState("");
	const [draftStartDayKey, setDraftStartDayKey] = useState<DayKey | null>(null);
	const [draftEndDayKey, setDraftEndDayKey] = useState<DayKey | null>(null);
	const [activeDateField, setActiveDateField] = useState<"start" | "end">("start");
	const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
	const [isTripImageViewerOpen, setIsTripImageViewerOpen] = useState(false);
	const [selectedTripMemoryId, setSelectedTripMemoryId] = useState<string | null>(
		null,
	);
	const [formError, setFormError] = useState<string | null>(null);
	const todayDayKey = toLocalDayKey(now);

	const {
		trips,
		memoryCountsByTripId,
		previewsByTripId,
		createTrip,
		isCreating,
		isLoading,
		maxEndDayKey,
	} = useTrips({
		userId: user?.id ?? null,
		todayDayKey,
	});

	const { memories, totalMemories, isLoading: isTripMemoriesLoading } =
		useTripMemories({
			userId: selectedTrip ? (user?.id ?? null) : null,
			startDayKey: selectedTrip?.startDayKey ?? todayDayKey,
			endDayKey: selectedTrip?.endDayKey ?? todayDayKey,
		});

	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(interval);
	}, []);

	const openCreateModal = () => {
		setTripName("");
		setDraftStartDayKey(todayDayKey);
		setDraftEndDayKey(todayDayKey);
		setActiveDateField("start");
		setFormError(null);
		setIsCreateModalOpen(true);
	};

	const closeCreateModal = () => {
		setIsCreateModalOpen(false);
		setTripName("");
		setDraftStartDayKey(null);
		setDraftEndDayKey(null);
		setActiveDateField("start");
		setFormError(null);
	};

	const onCreateTripPress = async () => {
		if (!draftStartDayKey || !draftEndDayKey) {
			setFormError("Select a start and end date.");
			return;
		}

		try {
			const normalizedName =
				tripName.trim() || buildFallbackTripName(draftStartDayKey, draftEndDayKey);
			await createTrip({
				name: normalizedName,
				startDayKey: draftStartDayKey,
				endDayKey: draftEndDayKey,
			});
			closeCreateModal();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to create trip.";
			setFormError(message);
			Alert.alert("Could not create trip", message);
		}
	};

	const onCalendarDayPress = (day: { dateString: string }) => {
		const dayKey = day.dateString as DayKey;

		if (!draftStartDayKey || !draftEndDayKey) {
			setDraftStartDayKey(dayKey);
			setDraftEndDayKey(dayKey);
			setActiveDateField("end");
			return;
		}

		if (activeDateField === "start") {
			setDraftStartDayKey(dayKey);
			if (compareDayKeys(dayKey, draftEndDayKey) > 0) {
				setDraftEndDayKey(dayKey);
			}
			setActiveDateField("end");
			return;
		}

		setDraftEndDayKey(dayKey);
		if (compareDayKeys(dayKey, draftStartDayKey) < 0) {
			setDraftStartDayKey(dayKey);
		}
	};

	const markedDates = useMemo(() => {
		const marks: Record<
			string,
			{
				startingDay?: boolean;
				endingDay?: boolean;
				color: string;
				textColor: string;
			}
		> = {};

		if (!draftStartDayKey || !draftEndDayKey) {
			return marks;
		}

		const dayKeys = listDayKeysInRange(draftStartDayKey, draftEndDayKey);
		for (const dayKey of dayKeys) {
			marks[dayKey] = {
				startingDay: dayKey === draftStartDayKey,
				endingDay: dayKey === draftEndDayKey,
				color: "#0a84ff",
				textColor: "#ffffff",
			};
		}

		return marks;
	}, [draftEndDayKey, draftStartDayKey]);

	const canCreateTrip = draftStartDayKey !== null && draftEndDayKey !== null && !isCreating;

	const closeTripDetails = () => {
		setIsTripImageViewerOpen(false);
		setSelectedTripMemoryId(null);
		setIsDetailSheetOpen(false);
		setSelectedTrip(null);
	};

	const openTripDetails = (trip: Trip) => {
		setSelectedTrip(trip);
		setIsDetailSheetOpen(true);
	};

	const onTripMemoryPress = (memoryId: string) => {
		setSelectedTripMemoryId(memoryId);
		setIsTripImageViewerOpen(true);
	};

	const tripImageViewerInitialIndex = useMemo(() => {
		if (!selectedTripMemoryId) {
			return 0;
		}
		const index = memories.findIndex((memory) => memory.id === selectedTripMemoryId);
		return index < 0 ? 0 : index;
	}, [memories, selectedTripMemoryId]);

	return (
		<SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
			<View className="px-5 pb-4 pt-3">
				<Text
					className="text-[34px] font-bold tracking-[-0.5px]"
					style={{ color: theme.textPrimary }}
				>
					Trips
				</Text>
				<Text className="mt-1 text-[15px]" style={{ color: theme.textTertiary }}>
					Your memories grouped by trip dates.
				</Text>
			</View>

			<ScrollView
				className="flex-1 px-5"
				contentContainerStyle={{ paddingBottom: 120 }}
				showsVerticalScrollIndicator={false}
			>
				{isLoading ? (
					<View className="pt-10">
						<ActivityIndicator size="small" color={theme.accent} />
					</View>
				) : null}

				<View className="mt-1 flex-row flex-wrap justify-between">
					<Pressable
						className="mb-4 rounded-2xl p-4 active:opacity-80"
						style={{ width: "48%", backgroundColor: theme.card }}
						onPress={openCreateModal}
					>
						<View className="items-center justify-center">
							<View
								className="items-center justify-center rounded-full"
								style={{
									width: 112,
									height: 112,
									backgroundColor: "#dcecff",
								}}
							>
								<Text
									className="text-[56px] font-semibold leading-[58px]"
									style={{ color: "#0a84ff" }}
								>
									+
								</Text>
							</View>
							<Text
								className="mt-1 text-center text-[16px] font-semibold"
								style={{ color: theme.textPrimary }}
							>
								New Trip
							</Text>
						</View>
					</Pressable>

					{trips.map((trip) => (
						<TripFolderCard
							key={trip.id}
							name={trip.name}
							previews={previewsByTripId[trip.id] ?? []}
							memoryCount={memoryCountsByTripId[trip.id] ?? 0}
							theme={theme}
							onPress={() => openTripDetails(trip)}
						/>
					))}
				</View>
			</ScrollView>

			<Modal
				visible={isCreateModalOpen}
				transparent
				animationType="slide"
				onRequestClose={closeCreateModal}
			>
				<View className="flex-1 justify-end" style={{ backgroundColor: "#00000055" }}>
					<SafeAreaView
						edges={["bottom"]}
						className="rounded-t-3xl"
						style={{ backgroundColor: theme.background, maxHeight: "90%" }}
					>
						<ScrollView
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: Math.max(20, insets.bottom + 8) }}
						>
							<View className="mb-2 flex-row items-center justify-between">
								<Text className="text-[24px] font-semibold" style={{ color: theme.textPrimary }}>
									Create trip
								</Text>
								<Pressable className="rounded-lg px-2 py-1" onPress={closeCreateModal}>
									<Text className="text-[16px]" style={{ color: theme.accent }}>
										Close
									</Text>
								</Pressable>
							</View>

							<View className="rounded-2xl p-4" style={{ backgroundColor: theme.card }}>
								<Text className="mb-2 text-[13px] font-medium" style={{ color: theme.textTertiary }}>
									Trip name (optional)
								</Text>
								<TextInput
									value={tripName}
									onChangeText={(value) => {
										setTripName(value);
										if (formError) {
											setFormError(null);
										}
									}}
									placeholder="e.g. NYC weekend"
									placeholderTextColor={theme.textTertiary}
									className="rounded-xl px-4 py-3 text-[16px]"
									style={{ backgroundColor: theme.background, color: theme.textPrimary }}
									maxLength={60}
								/>
							</View>

							<View className="mt-3 rounded-2xl p-4" style={{ backgroundColor: theme.card }}>
								<View className="mb-3 flex-row items-center justify-between">
									<Text className="text-[13px] font-medium" style={{ color: theme.textTertiary }}>
										Dates
									</Text>
									<Text className="text-[12px]" style={{ color: theme.textTertiary }}>
										{formatDayKey(todayDayKey, { month: "short", day: "numeric" })} - {formatDayKey(maxEndDayKey, {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</Text>
								</View>

								<View className="mb-3 flex-row gap-2">
									<Pressable
										className="flex-1 rounded-xl px-3 py-2"
										onPress={() => setActiveDateField("start")}
										style={{
											backgroundColor: activeDateField === "start" ? "#dcecff" : theme.background,
										}}
									>
										<Text className="text-[11px] font-semibold uppercase" style={{ color: theme.textTertiary }}>
											Start
										</Text>
										<Text className="mt-1 text-[14px] font-semibold" style={{ color: theme.textPrimary }}>
											{draftStartDayKey ? formatDayKey(draftStartDayKey) : "Select"}
										</Text>
									</Pressable>

									<Pressable
										className="flex-1 rounded-xl px-3 py-2"
										onPress={() => setActiveDateField("end")}
										style={{
											backgroundColor: activeDateField === "end" ? "#dcecff" : theme.background,
										}}
									>
										<Text className="text-[11px] font-semibold uppercase" style={{ color: theme.textTertiary }}>
											End
										</Text>
										<Text className="mt-1 text-[14px] font-semibold" style={{ color: theme.textPrimary }}>
											{draftEndDayKey ? formatDayKey(draftEndDayKey) : "Select"}
										</Text>
									</Pressable>
								</View>

								<Calendar
									minDate={todayDayKey}
									maxDate={maxEndDayKey}
									onDayPress={onCalendarDayPress}
									markingType="period"
									markedDates={markedDates}
									hideExtraDays
									enableSwipeMonths
									theme={{
										backgroundColor: theme.card,
										calendarBackground: theme.card,
										textSectionTitleColor: theme.textTertiary,
										selectedDayBackgroundColor: "#0a84ff",
										selectedDayTextColor: "#ffffff",
										todayTextColor: "#0a84ff",
										dayTextColor: theme.textPrimary,
										textDisabledColor: "#c2cad4",
										arrowColor: "#0a84ff",
										monthTextColor: theme.textPrimary,
										textMonthFontWeight: "700",
										textDayFontSize: 15,
										textMonthFontSize: 20,
										textDayHeaderFontSize: 12,
									}}
									style={{ borderRadius: 14, overflow: "hidden", paddingBottom: 8 }}
								/>
							</View>

							{formError ? (
								<Text className="mt-3 text-[13px]" style={{ color: "#b42318" }}>
									{formError}
								</Text>
							) : null}

							<Pressable
								className="mt-4 items-center rounded-xl px-4 py-3 active:opacity-80"
								disabled={!canCreateTrip}
								onPress={() => {
									void onCreateTripPress();
								}}
								style={{
									backgroundColor: canCreateTrip ? "#0a84ff" : "#b7c5d7",
								}}
							>
								<Text className="text-[16px] font-semibold text-white">
									{isCreating ? "Creating..." : "Create trip"}
								</Text>
							</Pressable>
						</ScrollView>
					</SafeAreaView>
				</View>
			</Modal>

			<Modal
				visible={isDetailSheetOpen}
				animationType="slide"
				onRequestClose={closeTripDetails}
			>
				<View className="flex-1" style={{ backgroundColor: theme.background }}>
					{/* Fixed hero header */}
					<View style={detailStyles.hero}>
						{memories.length > 0 && !memories[0].uri.startsWith("mock://") ? (
							<Image
								source={{ uri: memories[0].uri }}
								style={StyleSheet.absoluteFill}
								resizeMode="cover"
								blurRadius={24}
							/>
						) : (
							<View
								style={[
									StyleSheet.absoluteFill,
									{
										backgroundColor: isDark
											? "#2c2c2e"
											: "#e8e8ed",
									},
								]}
							/>
						)}
						<LinearGradient
							colors={[
								"transparent",
								isDark
									? "rgba(28,28,30,0.95)"
									: "rgba(255,255,255,0.90)",
							]}
							style={StyleSheet.absoluteFill}
						/>

						<Pressable
							style={[
								detailStyles.closeBtn,
								{
									top: insets.top + 8,
									backgroundColor: isDark
										? "rgba(255,255,255,0.15)"
										: "rgba(0,0,0,0.08)",
								},
							]}
							onPress={closeTripDetails}
							className="active:opacity-70"
						>
							<Text
								style={{
									fontSize: 17,
									fontWeight: "600",
									color: isDark ? "#fff" : "#1c1c1e",
								}}
							>
								✕
							</Text>
						</Pressable>

						<View style={detailStyles.heroContent}>
							<Text
								style={[
									detailStyles.heroTitle,
									{ color: isDark ? "#f2f2f7" : "#111" },
								]}
								numberOfLines={2}
							>
								{selectedTrip?.name ?? "Trip"}
							</Text>
							<View style={detailStyles.metaRow}>
								{selectedTrip && (
									<View
										style={[
											detailStyles.datePill,
											{
												backgroundColor: isDark
													? "rgba(255,255,255,0.12)"
													: "rgba(0,0,0,0.06)",
											},
										]}
									>
										<Text
											style={[
												detailStyles.datePillText,
												{
													color: isDark
														? "#a1a1a6"
														: "#6e6e73",
												},
											]}
										>
											{formatDayKey(selectedTrip.startDayKey, {
												month: "short",
												day: "numeric",
											})}{" "}
											–{" "}
											{formatDayKey(selectedTrip.endDayKey, {
												month: "short",
												day: "numeric",
												year: "numeric",
											})}
										</Text>
									</View>
								)}
								<Text
									style={{
										fontSize: 14,
										fontWeight: "500",
										color: isDark ? "#a1a1a6" : "#6e6e73",
										marginLeft: 8,
									}}
								>
									{totalMemories}{" "}
									{totalMemories === 1 ? "memory" : "memories"}
								</Text>
							</View>
						</View>
					</View>

					{/* Scrollable photo grid */}
					{isTripMemoriesLoading ? (
						<View className="flex-1 items-center pt-10">
							<ActivityIndicator
								size="small"
								color={theme.accent}
							/>
						</View>
					) : memories.length === 0 ? (
						<View className="flex-1 items-center justify-center px-5">
							<View
								style={[
									detailStyles.emptyCard,
									{
										backgroundColor: isDark
											? "#2c2c2e"
											: "#f2f2f7",
									},
								]}
							>
								<Text
									style={{
										fontSize: 17,
										fontWeight: "600",
										color: theme.textPrimary,
										textAlign: "center",
									}}
								>
									No memories yet
								</Text>
								<Text
									style={{
										fontSize: 14,
										color: theme.textTertiary,
										textAlign: "center",
										marginTop: 6,
									}}
								>
									Add memories from the calendar{"\n"}during
									this date range.
								</Text>
							</View>
						</View>
					) : (
						<ScrollView
							className="flex-1"
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{
								paddingHorizontal: GRID_PAD,
								paddingTop: 14,
								paddingBottom: Math.max(36, insets.bottom + 16),
							}}
						>
							<View style={detailStyles.grid}>
								{memories.map((memory: DayMemory, idx: number) => {
									const isLeft = idx % 2 === 0;
									return (
										<View
											key={memory.id}
											style={[
												detailStyles.gridItem,
												{
													marginRight: isLeft ? GRID_GAP / 2 : 0,
													marginLeft: isLeft ? 0 : GRID_GAP / 2,
													backgroundColor: isDark
														? "#2c2c2e"
														: "#f2f2f7",
												},
											]}
										>
											<Pressable
												style={{ width: "100%", height: "100%" }}
												onPress={() => onTripMemoryPress(memory.id)}
											>
												{memory.uri.startsWith("mock://") ? (
													<View
														style={{
															width: "100%",
															height: "100%",
															justifyContent: "center",
															alignItems: "center",
															backgroundColor:
																mockColorFromUri(memory.uri),
														}}
													>
														<Text
															style={{
																fontSize: 12,
																fontWeight: "600",
																color: "#1c1c1e",
															}}
														>
															Memory
														</Text>
													</View>
												) : (
													<Image
														source={{ uri: memory.uri }}
														style={{ width: "100%", height: "100%" }}
														resizeMode="cover"
													/>
												)}
											</Pressable>
										</View>
									);
								})}
							</View>
						</ScrollView>
					)}

					<ImageViewer
						visible={isTripImageViewerOpen}
						memories={memories}
						initialIndex={tripImageViewerInitialIndex}
						allowDelete={false}
						embedded
						onClose={() => {
							setIsTripImageViewerOpen(false);
						}}
					/>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const detailStyles = StyleSheet.create({
	hero: {
		height: 240,
		position: "relative",
		overflow: "hidden",
	},
	closeBtn: {
		position: "absolute",
		right: 16,
		width: 34,
		height: 34,
		borderRadius: 17,
		alignItems: "center",
		justifyContent: "center",
	},
	heroContent: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 20,
		paddingBottom: 18,
	},
	heroTitle: {
		fontSize: 30,
		fontWeight: "700",
		letterSpacing: -0.5,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
	},
	datePill: {
		borderRadius: 10,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	datePillText: {
		fontSize: 13,
		fontWeight: "500",
	},
	emptyCard: {
		width: "100%",
		borderRadius: 20,
		paddingVertical: 40,
		paddingHorizontal: 24,
		alignItems: "center",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
	},
	gridItem: {
		width: GRID_ITEM_WIDTH,
		height: GRID_ITEM_WIDTH / 0.75,
		borderRadius: 16,
		overflow: "hidden",
		marginBottom: GRID_GAP,
	},
});
