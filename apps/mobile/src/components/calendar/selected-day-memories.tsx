import { useState, useRef } from "react";
import {
	Image,
	PanResponder,
	Pressable,
	ScrollView,
	Text,
	View,
	useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DayMemory } from "../../features/memories/types";
import { ImageViewer } from "./image-viewer";

type SelectedDayMemoriesProps = {
	dateLabel: string;
	memories: DayMemory[];
	onAddPress: () => void;
	canAddMemory: boolean;
	bottomInset?: number;
	viewportHeight?: number;
	textPrimary: string;
	textSecondary: string;
	cardColor: string;
	addButtonBgColor: string;
	addButtonIconColor: string;
	onScrollDown?: () => void;
	onPullDown?: () => void;
	onImageViewerVisibilityChange?: (visible: boolean) => void;
};

const gridGap = 10;

function mockColorFromUri(uri: string): string {
	let hash = 0;
	for (let i = 0; i < uri.length; i += 1) {
		hash = (hash << 5) - hash + uri.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 55%, 78%)`;
}

function MemoryThumbnail({
	memory,
}: {
	memory: DayMemory;
}) {
	if (memory.uri.startsWith("mock://")) {
		return (
			<View
				className="items-center justify-center rounded-[10px]"
				style={{
					width: "100%",
					aspectRatio: 1,
					backgroundColor: mockColorFromUri(memory.uri),
				}}
			>
				<Text className="text-[11px] font-semibold text-[#1c1c1e]">Memory</Text>
			</View>
		);
	}

	return (
		<View
			style={{
				width: "100%",
				aspectRatio: 1,
				borderRadius: 12,
				overflow: "hidden",
			}}
		>
			<Image
				source={{ uri: memory.uri }}
				resizeMode="cover"
				style={{
					width: "100%",
					height: "100%",
					borderRadius: 12,
					transform: [{ scale: 1.08 }],
				}}
			/>
		</View>
	);
}

export function SelectedDayMemories({
	dateLabel,
	memories,
	onAddPress,
	canAddMemory,
	bottomInset = 110,
	viewportHeight,
	textPrimary,
	textSecondary,
	cardColor,
	addButtonBgColor,
	addButtonIconColor,
	onScrollDown,
	onPullDown,
	onImageViewerVisibilityChange,
}: SelectedDayMemoriesProps) {
	const { height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const memoriesViewportHeight =
		viewportHeight ?? Math.max(260, Math.min(560, height * 0.66));
	const tabClearanceInset = Math.max(bottomInset, insets.bottom + 120);
	const hasTriggeredScrollDownRef = useRef(false);
	const hasTriggeredHeaderSwipeRef = useRef(false);
	const scrollOffsetYRef = useRef(0);
	const dragStartOffsetYRef = useRef(0);
	const [isViewerOpen, setIsViewerOpen] = useState(false);
	const [viewerIndex, setViewerIndex] = useState(0);
	const headerPanResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponderCapture: () => false,
			onMoveShouldSetPanResponderCapture: (_, gestureState) =>
				Math.abs(gestureState.dy) > 4 &&
				Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 0.7,
			onMoveShouldSetPanResponder: (_, gestureState) =>
				Math.abs(gestureState.dy) > 4 &&
				Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 0.7,
			onPanResponderGrant: () => {
				hasTriggeredHeaderSwipeRef.current = false;
			},
			onPanResponderMove: (_, gestureState) => {
				if (hasTriggeredHeaderSwipeRef.current) {
					return;
				}

				if (gestureState.dy < -12 && onScrollDown) {
					hasTriggeredHeaderSwipeRef.current = true;
					onScrollDown();
					return;
				}

				if (gestureState.dy > 12 && onPullDown) {
					if (scrollOffsetYRef.current <= 2) {
						hasTriggeredHeaderSwipeRef.current = true;
						onPullDown();
					}
				}
			},
			onPanResponderRelease: (_, gestureState) => {
				if (!hasTriggeredHeaderSwipeRef.current) {
					if (
						(gestureState.dy < -12 || gestureState.vy < -0.35) &&
						onScrollDown
					) {
						onScrollDown();
					} else if (
						(gestureState.dy > 12 || gestureState.vy > 0.35) &&
						onPullDown &&
						scrollOffsetYRef.current <= 2
					) {
						onPullDown();
					}
				}
				hasTriggeredHeaderSwipeRef.current = false;
			},
			onPanResponderTerminate: () => {
				hasTriggeredHeaderSwipeRef.current = false;
			},
		}),
	).current;

	return (
		<View className="rounded-2xl p-4" style={{ backgroundColor: cardColor }}>
			<View
				{...headerPanResponder.panHandlers}
				className="mb-3 flex-row items-center justify-between"
			>
				<View>
					<Text
						className="text-[16px] font-semibold"
						style={{ color: textPrimary }}
					>
						{dateLabel}
					</Text>
					<Text className="mt-1 text-[14px]" style={{ color: textSecondary }}>
						{memories.length === 0
							? "No memories yet."
							: `${memories.length} ${memories.length === 1 ? "memory" : "memories"}`}
					</Text>
				</View>

				{canAddMemory ? (
					<Pressable
						className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
						onPress={onAddPress}
						style={{ backgroundColor: addButtonBgColor }}
					>
						<Text
							className="text-[22px] font-semibold leading-[24px]"
							style={{ color: addButtonIconColor }}
						>
							+
						</Text>
					</Pressable>
				) : null}
			</View>

			{memories.length > 0 ? (
				<ScrollView
					showsVerticalScrollIndicator={false}
					alwaysBounceVertical={false}
					style={{ height: memoriesViewportHeight }}
					contentContainerStyle={{ paddingBottom: tabClearanceInset }}
					scrollIndicatorInsets={{ bottom: tabClearanceInset }}
					onScrollBeginDrag={(event) => {
						dragStartOffsetYRef.current = Math.max(
							0,
							event.nativeEvent.contentOffset.y,
						);
					}}
					onScrollEndDrag={(event) => {
						const endOffsetY = event.nativeEvent.contentOffset.y;
						const startedAtTop = dragStartOffsetYRef.current <= 2;
						const pulledDownFromTop = endOffsetY < -18;
						if (onPullDown && startedAtTop && pulledDownFromTop) {
							onPullDown();
						}
					}}
					onScroll={(event) => {
						const offsetY = event.nativeEvent.contentOffset.y;
						scrollOffsetYRef.current = Math.max(0, offsetY);

						if (offsetY <= 2) {
							hasTriggeredScrollDownRef.current = false;
						}

						if (
							onScrollDown &&
							offsetY > 12 &&
							!hasTriggeredScrollDownRef.current
						) {
							hasTriggeredScrollDownRef.current = true;
							onScrollDown();
						}
					}}
					scrollEventThrottle={16}
				>
					<View className="flex-row flex-wrap justify-between">
						{memories.map((memory, index) => (
							<View
								key={memory.id}
								style={{ width: "48.5%", marginBottom: gridGap }}
							>
								<Pressable
									onPress={() => {
										setViewerIndex(index);
										setIsViewerOpen(true);
										onImageViewerVisibilityChange?.(true);
									}}
								>
									<MemoryThumbnail memory={memory} />
								</Pressable>
							</View>
						))}
					</View>
				</ScrollView>
			) : null}

			<ImageViewer
				visible={isViewerOpen}
				memories={memories}
				initialIndex={viewerIndex}
				onClose={() => {
					setIsViewerOpen(false);
					onImageViewerVisibilityChange?.(false);
				}}
			/>
		</View>
	);
}
