import { useMemo, useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import { SafeAreaView, type EdgeInsets } from "react-native-safe-area-context";
import { ImageViewer } from "../calendar/image-viewer";
import {
	compareDayKeys,
	formatDayKey,
	listDayKeysInRange,
} from "../../features/memories/day-key";
import type { DayKey, DayMemory } from "../../features/memories/types";
import { useTripMemories } from "../../features/trips/use-trips";
import type { Trip } from "../../features/trips/types";
import type { AppTheme } from "../../theme/colors";

const GRID_PAD = 16;
const GRID_GAP = 8;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - GRID_PAD * 2 - GRID_GAP) / 2;

function mockColorFromUri(uri: string): string {
	let hash = 0;
	for (let i = 0; i < uri.length; i += 1) {
		hash = (hash << 5) - hash + uri.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 55%, 62%)`;
}

export type TripDetailSheetProps = {
	visible: boolean;
	trip: Trip | null;
	userId: string | null;
	theme: AppTheme;
	isDark: boolean;
	insets: EdgeInsets;
	onClose: () => void;
	onTripUpdated: (trip: Trip) => void;
	renameTrip: (input: { tripId: string; name: string }) => Promise<Trip>;
	updateTripDates: (input: {
		tripId: string;
		startDayKey: DayKey;
		endDayKey: DayKey;
	}) => Promise<Trip>;
	isRenaming: boolean;
	isUpdatingTripDates: boolean;
};

export function TripDetailSheet({
	visible,
	trip,
	userId,
	theme,
	isDark,
	insets,
	onClose,
	onTripUpdated,
	renameTrip,
	updateTripDates,
	isRenaming,
	isUpdatingTripDates,
}: TripDetailSheetProps) {
	const [isTripImageViewerOpen, setIsTripImageViewerOpen] = useState(false);
	const [selectedTripMemoryId, setSelectedTripMemoryId] = useState<string | null>(
		null,
	);
	const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
	const [renameTripName, setRenameTripName] = useState("");
	const [renameError, setRenameError] = useState<string | null>(null);
	const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);
	const [editStartDayKey, setEditStartDayKey] = useState<DayKey | null>(null);
	const [editEndDayKey, setEditEndDayKey] = useState<DayKey | null>(null);
	const [editActiveDateField, setEditActiveDateField] = useState<"start" | "end">(
		"start",
	);
	const [editDatesError, setEditDatesError] = useState<string | null>(null);

	const { memories, totalMemories, isLoading: isTripMemoriesLoading } =
		useTripMemories({
			userId: trip ? userId : null,
			startDayKey: trip?.startDayKey ?? "1970-01-01",
			endDayKey: trip?.endDayKey ?? "1970-01-01",
		});

	const closeTripDetails = () => {
		setIsTripImageViewerOpen(false);
		setSelectedTripMemoryId(null);
		setIsRenameModalOpen(false);
		setRenameTripName("");
		setRenameError(null);
		setIsEditDatesModalOpen(false);
		setEditStartDayKey(null);
		setEditEndDayKey(null);
		setEditActiveDateField("start");
		setEditDatesError(null);
		onClose();
	};

	const onTripMemoryPress = (memoryId: string) => {
		setSelectedTripMemoryId(memoryId);
		setIsTripImageViewerOpen(true);
	};

	const openRenameModal = () => {
		if (!trip) {
			return;
		}
		setRenameTripName(trip.name);
		setRenameError(null);
		setIsRenameModalOpen(true);
	};

	const closeRenameModal = () => {
		setIsRenameModalOpen(false);
		setRenameTripName("");
		setRenameError(null);
	};

	const openEditDatesModal = () => {
		if (!trip) {
			return;
		}
		setEditStartDayKey(trip.startDayKey);
		setEditEndDayKey(trip.endDayKey);
		setEditActiveDateField("start");
		setEditDatesError(null);
		setIsEditDatesModalOpen(true);
	};

	const closeEditDatesModal = () => {
		setIsEditDatesModalOpen(false);
		setEditStartDayKey(null);
		setEditEndDayKey(null);
		setEditActiveDateField("start");
		setEditDatesError(null);
	};

	const onEditDatesCalendarDayPress = (day: { dateString: string }) => {
		const dayKey = day.dateString as DayKey;

		if (!editStartDayKey || !editEndDayKey) {
			setEditStartDayKey(dayKey);
			setEditEndDayKey(dayKey);
			setEditActiveDateField("end");
			return;
		}

		if (editActiveDateField === "start") {
			setEditStartDayKey(dayKey);
			if (compareDayKeys(dayKey, editEndDayKey) > 0) {
				setEditEndDayKey(dayKey);
			}
			setEditActiveDateField("end");
			return;
		}

		setEditEndDayKey(dayKey);
		if (compareDayKeys(dayKey, editStartDayKey) < 0) {
			setEditStartDayKey(dayKey);
		}
	};

	const onSaveRenameTrip = async () => {
		if (!trip) {
			return;
		}

		try {
			const updatedTrip = await renameTrip({
				tripId: trip.id,
				name: renameTripName,
			});
			onTripUpdated(updatedTrip);
			closeRenameModal();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to rename trip.";
			setRenameError(message);
			Alert.alert("Could not rename trip", message);
		}
	};

	const onSaveTripDates = async () => {
		if (!trip || !editStartDayKey || !editEndDayKey) {
			setEditDatesError("Select a start and end date.");
			return;
		}

		try {
			const updatedTrip = await updateTripDates({
				tripId: trip.id,
				startDayKey: editStartDayKey,
				endDayKey: editEndDayKey,
			});
			onTripUpdated(updatedTrip);
			closeEditDatesModal();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to update trip dates.";
			setEditDatesError(message);
			Alert.alert("Could not update trip dates", message);
		}
	};

	const tripImageViewerInitialIndex = useMemo(() => {
		if (!selectedTripMemoryId) {
			return 0;
		}
		const index = memories.findIndex((memory) => memory.id === selectedTripMemoryId);
		return index < 0 ? 0 : index;
	}, [memories, selectedTripMemoryId]);

	const oldestTripMemory = useMemo(() => {
		if (memories.length === 0) {
			return null;
		}
		return memories.reduce((oldest, memory) =>
			memory.createdAt < oldest.createdAt ? memory : oldest,
		);
	}, [memories]);

	const editMarkedDates = useMemo(() => {
		const marks: Record<
			string,
			{
				startingDay?: boolean;
				endingDay?: boolean;
				color: string;
				textColor: string;
			}
		> = {};

		if (!editStartDayKey || !editEndDayKey) {
			return marks;
		}

		const dayKeys = listDayKeysInRange(editStartDayKey, editEndDayKey);
		for (const dayKey of dayKeys) {
			marks[dayKey] = {
				startingDay: dayKey === editStartDayKey,
				endingDay: dayKey === editEndDayKey,
				color: "#0a84ff",
				textColor: "#ffffff",
			};
		}

		return marks;
	}, [editEndDayKey, editStartDayKey]);

	const canSaveTripDates =
		editStartDayKey !== null && editEndDayKey !== null && !isUpdatingTripDates;

	return (
		<Modal visible={visible} animationType="slide" onRequestClose={closeTripDetails}>
			<View className="flex-1" style={{ backgroundColor: theme.background }}>
				<View style={styles.hero}>
					{oldestTripMemory && !oldestTripMemory.uri.startsWith("mock://") ? (
						<Image
							source={{ uri: oldestTripMemory.uri }}
							style={StyleSheet.absoluteFill}
							resizeMode="cover"
							blurRadius={24}
						/>
					) : (
						<View
							style={[
								StyleSheet.absoluteFill,
								{ backgroundColor: isDark ? "#2c2c2e" : "#e8e8ed" },
							]}
						/>
					)}
					<LinearGradient
						colors={[
							"transparent",
							isDark ? "rgba(28,28,30,0.95)" : "rgba(255,255,255,0.90)",
						]}
						style={StyleSheet.absoluteFill}
					/>

					<Pressable
						style={[
							styles.closeBtn,
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

					<View style={styles.heroContent}>
						<Pressable onPress={openRenameModal} className="self-start active:opacity-80">
							<Text
								style={[styles.heroTitle, { color: isDark ? "#f2f2f7" : "#111" }]}
								numberOfLines={2}
							>
								{trip?.name ?? "Trip"}
							</Text>
						</Pressable>
						<View style={styles.metaRow}>
							{trip && (
								<Pressable
									style={[
										styles.datePill,
										{
											backgroundColor: isDark
												? "rgba(255,255,255,0.12)"
												: "rgba(0,0,0,0.06)",
										},
									]}
									onPress={openEditDatesModal}
									className="active:opacity-80"
								>
									<Text
										style={[
											styles.datePillText,
											{ color: isDark ? "#a1a1a6" : "#6e6e73" },
										]}
									>
										{formatDayKey(trip.startDayKey, {
											month: "short",
											day: "numeric",
										})}{" "}
										–{" "}
										{formatDayKey(trip.endDayKey, {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</Text>
								</Pressable>
							)}
							<Text
								style={{
									fontSize: 14,
									fontWeight: "500",
									color: isDark ? "#a1a1a6" : "#6e6e73",
									marginLeft: 8,
								}}
							>
								{totalMemories} {totalMemories === 1 ? "memory" : "memories"}
							</Text>
						</View>
					</View>
				</View>

				{isTripMemoriesLoading ? (
					<View className="flex-1 items-center pt-10">
						<ActivityIndicator size="small" color={theme.accent} />
					</View>
				) : memories.length === 0 ? (
					<View className="flex-1 items-center justify-center px-5">
						<View
							style={[
								styles.emptyCard,
								{ backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7" },
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
								Add memories from the calendar{"\n"}during this date range.
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
						<View style={styles.grid}>
							{memories.map((memory: DayMemory, idx: number) => {
								const isLeft = idx % 2 === 0;
								return (
									<View
										key={memory.id}
										style={[
											styles.gridItem,
											{
												marginRight: isLeft ? GRID_GAP / 2 : 0,
												marginLeft: isLeft ? 0 : GRID_GAP / 2,
												backgroundColor: isDark ? "#2c2c2e" : "#f2f2f7",
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
														backgroundColor: mockColorFromUri(memory.uri),
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

				<Modal
					visible={isRenameModalOpen}
					transparent
					animationType="fade"
					onRequestClose={closeRenameModal}
				>
					<View
						className="flex-1 items-center justify-center px-6"
						style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
					>
						<View
							className="w-full rounded-2xl p-4"
							style={{ backgroundColor: theme.background, maxWidth: 420 }}
						>
							<Text className="text-[20px] font-semibold" style={{ color: theme.textPrimary }}>
								Rename trip
							</Text>
							<TextInput
								value={renameTripName}
								onChangeText={(value) => {
									setRenameTripName(value);
									if (renameError) {
										setRenameError(null);
									}
								}}
								placeholder="Trip name"
								placeholderTextColor={theme.textTertiary}
								className="mt-3 rounded-xl px-4 py-3 text-[16px]"
								style={{ backgroundColor: theme.card, color: theme.textPrimary }}
								autoFocus
								maxLength={60}
							/>
							{renameError ? (
								<Text className="mt-2 text-[13px]" style={{ color: "#b42318" }}>
									{renameError}
								</Text>
							) : null}

							<View className="mt-4 flex-row justify-end gap-2">
								<Pressable
									className="rounded-xl px-4 py-2.5 active:opacity-80"
									style={{ backgroundColor: theme.card }}
									onPress={closeRenameModal}
								>
									<Text style={{ color: theme.textPrimary, fontWeight: "600" }}>
										Cancel
									</Text>
								</Pressable>
								<Pressable
									className="rounded-xl px-4 py-2.5 active:opacity-80"
									style={{
										backgroundColor: theme.accent,
										opacity: isRenaming ? 0.7 : 1,
									}}
									disabled={isRenaming}
									onPress={() => {
										void onSaveRenameTrip();
									}}
								>
									<Text style={{ color: "#fff", fontWeight: "700" }}>
										{isRenaming ? "Saving..." : "Save"}
									</Text>
								</Pressable>
							</View>
						</View>
					</View>
				</Modal>

				<Modal
					visible={isEditDatesModalOpen}
					transparent
					animationType="slide"
					onRequestClose={closeEditDatesModal}
				>
					<View className="flex-1 justify-end" style={{ backgroundColor: "#00000055" }}>
						<SafeAreaView
							edges={["bottom"]}
							className="rounded-t-3xl"
							style={{ backgroundColor: theme.background, maxHeight: "90%" }}
						>
							<ScrollView
								showsVerticalScrollIndicator={false}
								contentContainerStyle={{
									paddingHorizontal: 20,
									paddingTop: 14,
									paddingBottom: Math.max(20, insets.bottom + 8),
								}}
							>
								<View className="mb-2 flex-row items-center justify-between">
									<Text className="text-[24px] font-semibold" style={{ color: theme.textPrimary }}>
										Edit dates
									</Text>
									<Pressable className="rounded-lg px-2 py-1" onPress={closeEditDatesModal}>
										<Text className="text-[16px]" style={{ color: theme.accent }}>
											Close
										</Text>
									</Pressable>
								</View>

								<View className="rounded-2xl p-4" style={{ backgroundColor: theme.card }}>
									<View className="mb-3 flex-row gap-2">
										<Pressable
											className="flex-1 rounded-xl px-3 py-2"
											onPress={() => setEditActiveDateField("start")}
											style={{
												backgroundColor:
													editActiveDateField === "start" ? "#dcecff" : theme.background,
											}}
										>
											<Text className="text-[11px] font-semibold uppercase" style={{ color: theme.textTertiary }}>
												Start
											</Text>
											<Text className="mt-1 text-[14px] font-semibold" style={{ color: theme.textPrimary }}>
												{editStartDayKey ? formatDayKey(editStartDayKey) : "Select"}
											</Text>
										</Pressable>

										<Pressable
											className="flex-1 rounded-xl px-3 py-2"
											onPress={() => setEditActiveDateField("end")}
											style={{
												backgroundColor:
													editActiveDateField === "end" ? "#dcecff" : theme.background,
											}}
										>
											<Text className="text-[11px] font-semibold uppercase" style={{ color: theme.textTertiary }}>
												End
											</Text>
											<Text className="mt-1 text-[14px] font-semibold" style={{ color: theme.textPrimary }}>
												{editEndDayKey ? formatDayKey(editEndDayKey) : "Select"}
											</Text>
										</Pressable>
									</View>

									<Calendar
										onDayPress={onEditDatesCalendarDayPress}
										markingType="period"
										markedDates={editMarkedDates}
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

								{editDatesError ? (
									<Text className="mt-3 text-[13px]" style={{ color: "#b42318" }}>
										{editDatesError}
									</Text>
								) : null}

								<View className="mt-4 flex-row justify-end gap-2">
									<Pressable
										className="rounded-xl px-4 py-2.5 active:opacity-80"
										style={{ backgroundColor: theme.card }}
										onPress={closeEditDatesModal}
									>
										<Text style={{ color: theme.textPrimary, fontWeight: "600" }}>
											Cancel
										</Text>
									</Pressable>
									<Pressable
										className="rounded-xl px-4 py-2.5 active:opacity-80"
										style={{
											backgroundColor: canSaveTripDates ? theme.accent : "#b7c5d7",
										}}
										disabled={!canSaveTripDates}
										onPress={() => {
											void onSaveTripDates();
										}}
									>
										<Text style={{ color: "#fff", fontWeight: "700" }}>
											{isUpdatingTripDates ? "Saving..." : "Save"}
										</Text>
									</Pressable>
								</View>
							</ScrollView>
						</SafeAreaView>
					</View>
				</Modal>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
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
