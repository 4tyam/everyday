import { useEffect, useRef } from "react";
import {
	FlatList,
	Image,
	Modal,
	PanResponder,
	Pressable,
	ScrollView,
	Text,
	View,
	useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DayMemory } from "../../features/memories/types";

type ImageViewerProps = {
	visible: boolean;
	memories: DayMemory[];
	initialIndex: number;
	onClose: () => void;
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

export function ImageViewer({
	visible,
	memories,
	initialIndex,
	onClose,
}: ImageViewerProps) {
	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const listRef = useRef<FlatList<DayMemory> | null>(null);
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
			return;
		}
		const index = Math.max(0, Math.min(initialIndex, memories.length - 1));
		const timer = setTimeout(() => {
			listRef.current?.scrollToIndex({ index, animated: false });
		}, 0);
		return () => clearTimeout(timer);
	}, [initialIndex, memories.length, visible]);

	return (
		<Modal
			visible={visible}
			animationType="fade"
			presentationStyle="fullScreen"
			onRequestClose={onClose}
		>
			<View
				{...swipeDownResponder.panHandlers}
				className="flex-1"
				style={{ backgroundColor: "#000000" }}
			>
				<FlatList
					ref={listRef}
					data={memories}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					getItemLayout={(_, index) => ({
						length: width,
						offset: width * index,
						index,
					})}
					renderItem={({ item }) => (
						<View
							className="items-center justify-center"
							style={{ width, height }}
						>
							{item.uri.startsWith("mock://") ? (
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
									showsHorizontalScrollIndicator={false}
									showsVerticalScrollIndicator={false}
								>
									<Image
										source={{ uri: item.uri }}
										resizeMode="contain"
										style={{ width: width * 0.95, height: height * 0.8 }}
									/>
								</ScrollView>
							)}
						</View>
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
					<Pressable
						hitSlop={10}
						onPress={onClose}
						style={{
							position: "absolute",
							right: 16,
							top: Math.max(insets.top + 8, 16),
							width: 36,
							height: 36,
							borderRadius: 18,
							backgroundColor: "rgba(255,255,255,0.16)",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 100,
							elevation: 8,
						}}
					>
						<Text
							style={{
								color: "#ffffff",
								fontSize: 21,
								lineHeight: 21,
								fontWeight: "600",
								marginTop: -1,
							}}
						>
							×
						</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
}
