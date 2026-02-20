import { useEffect, useRef, useState } from "react";
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
import SaveIcon from "../../assets/icons/save.svg";
import ShareIcon from "../../assets/icons/share.svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TrashIcon from "../../assets/icons/trash.svg";
import type { DayMemory } from "../../features/memories/types";

type ImageViewerProps = {
	visible: boolean;
	memories: DayMemory[];
	initialIndex: number;
	allowDelete?: boolean;
	onDeleteMemory?: (memory: DayMemory) => void;
	onClose: () => void;
	embedded?: boolean;
};

function mockColorFromUri(uri: string): string {
	let hash = 0;
	for (let i = 0; i < uri.length; i += 1) {
		hash = (hash << 5) - hash + uri.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 55%, 62%)`;
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
		<Pressable className="items-center justify-center" style={{ width, height }}>
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
	const insets = useSafeAreaInsets();
	const listRef = useRef<FlatList<DayMemory> | null>(null);
	const currentIndexRef = useRef(0);
	const didInitRef = useRef(false);
	const wasVisibleRef = useRef(false);

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
		listRef.current?.scrollToIndex({ index: clampedIndex, animated: false });
	}, [memories.length, visible]);

	useEffect(() => {
		if (!visible || memories.length === 0) {
			return;
		}
		// Warm nearby/fullscreen candidates early to reduce first-open blank time.
		prefetchAroundIndex(Math.max(0, Math.min(initialIndex, memories.length - 1)));
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
		await Share.share({ url: memory.uri });
	};

	const onSaveCurrentImage = async () => {
		const memory = memories[currentIndexRef.current];
		if (!memory) {
			return;
		}

		if (Platform.OS === "ios") {
			ActionSheetIOS.showShareActionSheetWithOptions(
				{ url: memory.uri },
				() => {},
				() => {},
			);
			return;
		}

		await Share.share({ url: memory.uri });
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
						{allowDelete ? (
							<Pressable
								hitSlop={8}
								onPress={onDeleteCurrentImage}
								style={{
									width: 44,
									height: 44,
									borderRadius: 22,
									backgroundColor: "rgba(25,25,27,0.86)",
									borderWidth: 1,
									borderColor: "rgba(255,255,255,0.14)",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<TrashIcon color="#ff453a" height={20} width={20} />
							</Pressable>
						) : (
							<View style={{ width: 44, height: 44 }} />
						)}
						<View style={{ alignItems: "flex-end", gap: 8 }}>
							<Pressable
								hitSlop={8}
								onPress={onClose}
								style={{
									width: 44,
									height: 44,
									borderRadius: 22,
									backgroundColor: "rgba(25,25,27,0.86)",
									borderWidth: 1,
									borderColor: "rgba(255,255,255,0.14)",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Text
									style={{
										color: "#ffffff",
										fontSize: 23,
										lineHeight: 23,
										fontWeight: "600",
										marginTop: -1,
									}}
								>
									×
								</Text>
							</Pressable>
							<View
								style={{
									flexDirection: "row",
									height: 44,
									width: 102,
									borderRadius: 22,
									backgroundColor: "rgba(25,25,27,0.86)",
									borderWidth: 1,
									borderColor: "rgba(255,255,255,0.14)",
									overflow: "hidden",
								}}
							>
								<Pressable
									hitSlop={8}
									onPress={() => {
										void onSaveCurrentImage();
									}}
									style={{
										flex: 1,
										height: 44,
										alignItems: "flex-end",
										justifyContent: "center",
										paddingRight: 9,
									}}
								>
									<SaveIcon color="#ffffff" height={20} width={20} />
								</Pressable>
								<Pressable
									hitSlop={8}
									onPress={() => {
										void onShareCurrentImage();
									}}
									style={{
										flex: 1,
										height: 44,
										alignItems: "flex-start",
										justifyContent: "center",
										paddingLeft: 9,
									}}
								>
									<ShareIcon color="#ffffff" height={20} width={20} />
								</Pressable>
							</View>
						</View>
					</View>
				</View>
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
