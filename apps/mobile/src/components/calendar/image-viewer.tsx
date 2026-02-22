import Constants from "expo-constants";
import { Directory, File, Paths } from "expo-file-system";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ActionSheetIOS,
	Alert,
	Animated,
	FlatList,
	Image,
	Modal,
	PanResponder,
	Platform,
	Pressable,
	Share,
	ScrollView,
	Text,
	useColorScheme,
	View,
	useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ArrowLeftIcon from "../../assets/icons/arrowLeft.svg";
import IconDotsVertical from "../../assets/icons/IconDotsVertical.svg";
import type { DayMemory } from "../../features/memories/types";

type SwiftUIModule = typeof import("@expo/ui/swift-ui");
type ExpoMediaLibraryModule = {
	getPermissionsAsync: () => Promise<{
		status: "granted" | "denied" | "undetermined";
		canAskAgain?: boolean;
	}>;
	requestPermissionsAsync: () => Promise<{
		status: "granted" | "denied" | "undetermined";
		canAskAgain?: boolean;
	}>;
	saveToLibraryAsync: (localUri: string) => Promise<void>;
};

function loadSwiftUI(): SwiftUIModule | null {
	try {
		return require("@expo/ui/swift-ui") as SwiftUIModule;
	} catch {
		return null;
	}
}

function loadExpoMediaLibrary(): ExpoMediaLibraryModule | null {
	try {
		return require("expo-media-library") as ExpoMediaLibraryModule;
	} catch {
		return null;
	}
}

type ImageViewerProps = {
	visible: boolean;
	memories: DayMemory[];
	initialIndex: number;
	allowDelete?: boolean;
	onDeleteMemory?: (memory: DayMemory) => void;
	onClose: () => void;
	embedded?: boolean;
};

function formatMemoryDateTime(createdAt: number): string {
	const date = new Date(createdAt);
	const currentYear = new Date().getFullYear();
	const includeYear = date.getFullYear() !== currentYear;
	const dateLabel = new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		...(includeYear ? { year: "numeric" } : {}),
	}).format(date);
	const timeLabel = new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
	return `${dateLabel} • ${timeLabel}`;
}

function mockColorFromUri(uri: string): string {
	let hash = 0;
	for (let i = 0; i < uri.length; i += 1) {
		hash = (hash << 5) - hash + uri.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 55%, 62%)`;
}

function getUriExtension(uri: string): string {
	const normalized = uri.split("?")[0] ?? uri;
	const dotIndex = normalized.lastIndexOf(".");
	if (dotIndex <= 0 || dotIndex === normalized.length - 1) {
		return "jpg";
	}
	return normalized.slice(dotIndex + 1).toLowerCase();
}

function buildShareFileName(memory: DayMemory): string {
	const date = new Date(memory.createdAt);
	const monthShort = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	][date.getMonth()];
	const day = date.getDate();
	return `everyday Memory - ${monthShort} ${day}.${getUriExtension(memory.uri)}`;
}

function ViewerMemorySlide({
	item,
	width,
	height,
	isDark,
}: {
	item: DayMemory;
	width: number;
	height: number;
	isDark: boolean;
}) {
	const isMock = item.uri.startsWith("mock://");
	const [isLoaded, setIsLoaded] = useState(isMock);
	const pulseOpacity = useRef(new Animated.Value(0.45)).current;

	const handleImageLoaded = () => {
		setIsLoaded(true);
	};

	useEffect(() => {
		if (isMock || isLoaded) {
			pulseOpacity.stopAnimation();
			return;
		}
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseOpacity, {
					toValue: 0.8,
					duration: 650,
					useNativeDriver: true,
				}),
				Animated.timing(pulseOpacity, {
					toValue: 0.35,
					duration: 650,
					useNativeDriver: true,
				}),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [isLoaded, isMock, pulseOpacity]);

	return (
		<Pressable
			className="items-center justify-center"
			style={{ width, height }}
		>
			{isMock ? (
				<View
					className="items-center justify-center rounded-2xl"
					style={{
						width: width * 0.88,
						height: height * 0.68,
						backgroundColor: mockColorFromUri(item.uri),
					}}
				>
					<Text className="text-[18px] font-semibold text-[#1c1c1e]">
						Memory
					</Text>
				</View>
			) : (
				<ScrollView
					style={{ width, height }}
					contentContainerStyle={{
						width,
						height,
						alignItems: "center",
						justifyContent: "center",
					}}
					centerContent
					maximumZoomScale={4}
					minimumZoomScale={1}
					bouncesZoom={false}
					pinchGestureEnabled
					showsHorizontalScrollIndicator={false}
					showsVerticalScrollIndicator={false}
				>
					<View
						style={{
							width: width * 0.95,
							height: height * 0.8,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{!isLoaded ? (
							<Animated.View
								style={{
									position: "absolute",
									width: width * 0.84,
									height: height * 0.62,
									borderRadius: 16,
									backgroundColor: isDark ? "#2c2c2e" : "#e8e8ed",
									opacity: pulseOpacity,
								}}
							/>
						) : null}
						<Image
							source={{ uri: item.uri }}
							resizeMode="contain"
							onLoadEnd={handleImageLoaded}
							style={{
								width: "100%",
								height: "100%",
								opacity: isLoaded ? 1 : 0,
							}}
						/>
					</View>
				</ScrollView>
			)}
		</Pressable>
	);
}

export function ImageViewer({
	visible,
	memories,
	initialIndex,
	allowDelete = true,
	onDeleteMemory,
	onClose,
	embedded = false,
}: ImageViewerProps) {
	const { width, height } = useWindowDimensions();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const iconColor = isDark ? "#ffffff" : "#111111";
	const insets = useSafeAreaInsets();
	const topControlSize = 40;
	const topControlStyle = {
		width: topControlSize,
		height: topControlSize,
		borderRadius: topControlSize / 2,
		backgroundColor: "rgba(255,255,255,0.22)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.44)",
		alignItems: "center" as const,
		justifyContent: "center" as const,
		shadowColor: "#000000",
		shadowOpacity: 0.18,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 3 },
		elevation: 4,
	};
	const canUseExpoUI =
		Platform.OS === "ios" && Constants.executionEnvironment !== "storeClient";
	const swiftUI = useMemo(
		() => (canUseExpoUI ? loadSwiftUI() : null),
		[canUseExpoUI],
	);
	const listRef = useRef<FlatList<DayMemory> | null>(null);
	const currentIndexRef = useRef(0);
	const didInitRef = useRef(false);
	const wasVisibleRef = useRef(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	const prefetchAroundIndex = (centerIndex: number) => {
		const start = Math.max(0, centerIndex - 2);
		const end = Math.min(memories.length - 1, centerIndex + 4);
		for (let i = start; i <= end; i += 1) {
			const uri = memories[i]?.uri;
			if (!uri || uri.startsWith("mock://")) {
				continue;
			}
			void Image.prefetch(uri);
		}
	};
	const swipeDownResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponderCapture: (_, gestureState) =>
				Math.abs(gestureState.dy) > 10 &&
				Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
			onMoveShouldSetPanResponder: (_, gestureState) =>
				Math.abs(gestureState.dy) > 10 &&
				Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
			onPanResponderRelease: (_, gestureState) => {
				if (gestureState.dy > 52 || gestureState.vy > 0.65) {
					onClose();
				}
			},
		}),
	).current;

	useEffect(() => {
		if (!visible) {
			didInitRef.current = false;
			currentIndexRef.current = 0;
			wasVisibleRef.current = false;
			return;
		}
		if (memories.length === 0) {
			onClose();
			return;
		}
		if (wasVisibleRef.current) {
			return;
		}
		wasVisibleRef.current = true;
		const index = Math.max(0, Math.min(initialIndex, memories.length - 1));
		currentIndexRef.current = index;
		setCurrentIndex(index);
		didInitRef.current = true;
		const timer = setTimeout(() => {
			listRef.current?.scrollToIndex({ index, animated: false });
		}, 0);
		return () => clearTimeout(timer);
	}, [initialIndex, memories.length, onClose, visible]);

	useEffect(() => {
		if (!visible || !didInitRef.current || memories.length === 0) {
			return;
		}
		const clampedIndex = Math.max(
			0,
			Math.min(currentIndexRef.current, memories.length - 1),
		);
		currentIndexRef.current = clampedIndex;
		setCurrentIndex(clampedIndex);
		listRef.current?.scrollToIndex({ index: clampedIndex, animated: false });
	}, [memories.length, visible]);

	useEffect(() => {
		if (!visible || memories.length === 0) {
			return;
		}
		// Warm nearby/fullscreen candidates early to reduce first-open blank time.
		prefetchAroundIndex(
			Math.max(0, Math.min(initialIndex, memories.length - 1)),
		);
	}, [initialIndex, memories, visible]);

	const onDeleteCurrentImage = () => {
		if (!allowDelete || !onDeleteMemory) {
			return;
		}
		const memory = memories[currentIndexRef.current];
		if (!memory) {
			return;
		}
		Alert.alert("Are you sure you want to delete this memory?", "", [
			{ text: "No", style: "cancel" },
			{
				text: "Yes",
				style: "destructive",
				onPress: () => {
					onDeleteMemory(memory);
				},
			},
		]);
	};

	const onShareCurrentImage = async () => {
		const memory = memories[currentIndexRef.current];
		if (!memory) {
			return;
		}
		if (memory.uri.startsWith("mock://")) {
			Alert.alert(
				"Share unavailable",
				"This placeholder memory cannot be shared.",
			);
			return;
		}
		let shareUri = memory.uri;
		try {
			const shareDir = new Directory(Paths.cache, "share");
			shareDir.create({ idempotent: true, intermediates: true });
			const destination = new File(shareDir, buildShareFileName(memory));
			if (destination.exists) {
				destination.delete();
			}
			const source = new File(memory.uri);
			source.copy(destination);
			shareUri = destination.uri;
		} catch {
			// Best-effort copy for nicer share name; fallback to original URI.
		}
		await Share.share({
			url: shareUri,
			title: "Memory from Everyday",
		});
	};

	const onSaveCurrentImage = async () => {
		const memory = memories[currentIndexRef.current];
		if (!memory) {
			return;
		}
		if (memory.uri.startsWith("mock://")) {
			Alert.alert(
				"Download unavailable",
				"This placeholder memory cannot be saved.",
			);
			return;
		}

		const mediaLibrary = loadExpoMediaLibrary();
		if (!mediaLibrary) {
			Alert.alert(
				"Download failed",
				"Couldn't save this image to your gallery.",
			);
			return;
		}
		try {
			const existing = await mediaLibrary.getPermissionsAsync();
			let status = existing.status;
			if (status !== "granted") {
				const requested = await mediaLibrary.requestPermissionsAsync();
				status = requested.status;
			}
			if (status !== "granted") {
				Alert.alert(
					"Photos access needed",
					"Allow photo library access to save this image.",
				);
				return;
			}
			await mediaLibrary.saveToLibraryAsync(memory.uri);
		} catch {
			Alert.alert(
				"Download failed",
				"Couldn't save this image to your gallery.",
			);
		}
	};

	const onOpenMoreMenu = () => {
		if (Platform.OS === "ios") {
			const options = allowDelete
				? ["Download", "Share", "Delete", "Cancel"]
				: ["Download", "Share", "Cancel"];
			const cancelButtonIndex = options.length - 1;
			const destructiveButtonIndex = allowDelete ? 2 : undefined;
			ActionSheetIOS.showActionSheetWithOptions(
				{
					options,
					cancelButtonIndex,
					destructiveButtonIndex,
				},
				(buttonIndex) => {
					if (buttonIndex === cancelButtonIndex) {
						return;
					}
					const downloadIndex = 0;
					const shareIndex = 1;
					const deleteIndex = allowDelete ? 2 : -1;
					if (buttonIndex === downloadIndex) {
						void onSaveCurrentImage();
						return;
					}
					if (buttonIndex === shareIndex) {
						void onShareCurrentImage();
						return;
					}
					if (allowDelete && buttonIndex === deleteIndex) {
						onDeleteCurrentImage();
					}
				},
			);
			return;
		}

		const buttons = allowDelete
			? [
					{ text: "Download", onPress: () => void onSaveCurrentImage() },
					{ text: "Share", onPress: () => void onShareCurrentImage() },
					{
						text: "Delete",
						style: "destructive" as const,
						onPress: onDeleteCurrentImage,
					},
					{ text: "Cancel", style: "cancel" as const },
				]
			: [
					{ text: "Download", onPress: () => void onSaveCurrentImage() },
					{ text: "Share", onPress: () => void onShareCurrentImage() },
					{ text: "Cancel", style: "cancel" as const },
				];
		Alert.alert("Options", undefined, buttons);
	};

	const viewerBody = (
		<View
			{...swipeDownResponder.panHandlers}
			className="flex-1"
			style={{
				backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
				...(embedded
					? {
							position: "absolute",
							top: 0,
							right: 0,
							bottom: 0,
							left: 0,
							zIndex: 999,
						}
					: null),
			}}
		>
			<View
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
				}}
			>
				<FlatList
					ref={listRef}
					data={memories}
					keyExtractor={(item) => item.id}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					getItemLayout={(_, index) => ({
						length: width,
						offset: width * index,
						index,
					})}
					onMomentumScrollEnd={(event) => {
						const offsetX = event.nativeEvent.contentOffset.x;
						const nextIndex = Math.round(offsetX / width);
						currentIndexRef.current = Math.max(
							0,
							Math.min(nextIndex, memories.length - 1),
						);
						setCurrentIndex(currentIndexRef.current);
						prefetchAroundIndex(currentIndexRef.current);
					}}
					renderItem={({ item }) => (
						<ViewerMemorySlide
							item={item}
							width={width}
							height={height}
							isDark={isDark}
						/>
					)}
				/>

				<View
					pointerEvents="box-none"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					}}
				>
					<View
						style={{
							position: "absolute",
							left: 12,
							right: 12,
							top: Math.max(insets.top + 8, 16),
							flexDirection: "row",
							alignItems: "flex-start",
							justifyContent: "space-between",
							zIndex: 100,
							elevation: 8,
						}}
					>
						<Pressable hitSlop={8} onPress={onClose} style={topControlStyle}>
							<ArrowLeftIcon color={iconColor} height={15} width={15} />
						</Pressable>
						{swiftUI ? (
							<swiftUI.Host
								matchContents
								style={{ minHeight: topControlSize, minWidth: topControlSize }}
							>
								<swiftUI.ContextMenu>
									<swiftUI.ContextMenu.Items>
										<swiftUI.Button
											systemImage="arrow.down.circle"
											onPress={() => {
												void onSaveCurrentImage();
											}}
										>
											Download
										</swiftUI.Button>
										<swiftUI.Button
											systemImage="square.and.arrow.up"
											onPress={() => {
												void onShareCurrentImage();
											}}
										>
											Share
										</swiftUI.Button>
										{allowDelete ? (
											<swiftUI.Button
												systemImage="trash"
												onPress={onDeleteCurrentImage}
											>
												Delete
											</swiftUI.Button>
										) : null}
									</swiftUI.ContextMenu.Items>
									<swiftUI.ContextMenu.Trigger>
										<View
											style={{
												...topControlStyle,
											}}
										>
											<IconDotsVertical
												color={iconColor}
												height={18}
												width={18}
											/>
										</View>
									</swiftUI.ContextMenu.Trigger>
								</swiftUI.ContextMenu>
							</swiftUI.Host>
						) : (
							<Pressable
								hitSlop={8}
								onPress={onOpenMoreMenu}
								style={{
									...topControlStyle,
								}}
							>
								<IconDotsVertical color={iconColor} height={18} width={18} />
							</Pressable>
						)}
					</View>
				</View>
				{memories[currentIndex] ? (
					<View
						pointerEvents="none"
						style={{
							position: "absolute",
							left: 16,
							right: 16,
							bottom: Math.max(insets.bottom + 14, 20),
							alignItems: "center",
						}}
					>
						<Text
							numberOfLines={1}
							style={{
								fontSize: 14,
								fontWeight: "600",
								color: isDark ? "#f5f5f7" : "#1c1c1e",
							}}
						>
							{formatMemoryDateTime(memories[currentIndex].createdAt)}
						</Text>
					</View>
				) : null}
			</View>
		</View>
	);

	if (embedded) {
		if (!visible) {
			return null;
		}
		return viewerBody;
	}

	return (
		<Modal
			visible={visible}
			animationType="fade"
			presentationStyle="fullScreen"
			onRequestClose={onClose}
		>
			{viewerBody}
		</Modal>
	);
}
