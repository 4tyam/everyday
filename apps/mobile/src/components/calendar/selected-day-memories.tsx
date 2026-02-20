import { useRef } from "react";
import {
	Image,
	PanResponder,
	Pressable,
	ScrollView,
	Text,
	View,
	useWindowDimensions,
} from "react-native";
import type { DayMemory } from "../../features/memories/types";

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
};

function mockColorFromUri(uri: string): string {
	let hash = 0;
	for (let i = 0; i < uri.length; i += 1) {
		hash = (hash << 5) - hash + uri.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 55%, 78%)`;
}

function MemoryThumbnail({ memory }: { memory: DayMemory }) {
	if (memory.uri.startsWith("mock://")) {
		return (
			<View
				className="mb-2.5 items-center justify-center rounded-[10px]"
				style={{
					width: 102,
					height: 102,
					backgroundColor: mockColorFromUri(memory.uri),
				}}
			>
				<Text className="text-[11px] font-semibold text-[#1c1c1e]">Memory</Text>
			</View>
		);
	}

	return (
		<Image
			source={{ uri: memory.uri }}
			style={{
				width: 102,
				height: 102,
				marginBottom: 10,
				borderRadius: 10,
				backgroundColor: "#e5e5ea",
			}}
		/>
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
}: SelectedDayMemoriesProps) {
	const { height } = useWindowDimensions();
	const memoriesViewportHeight =
		viewportHeight ?? Math.max(260, Math.min(560, height * 0.66));
	const tabClearanceInset = bottomInset;
	const hasTriggeredScrollDownRef = useRef(false);
	const hasTriggeredPullDownRef = useRef(false);
	const hasTriggeredHeaderSwipeRef = useRef(false);
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
					hasTriggeredHeaderSwipeRef.current = true;
					onPullDown();
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
						onPullDown
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
					style={{ height: memoriesViewportHeight }}
					contentContainerStyle={{ paddingBottom: tabClearanceInset }}
					scrollIndicatorInsets={{ bottom: tabClearanceInset }}
					onScroll={(event) => {
						const offsetY = event.nativeEvent.contentOffset.y;

						if (offsetY <= 2) {
							hasTriggeredScrollDownRef.current = false;
						}

						if (offsetY >= -2) {
							hasTriggeredPullDownRef.current = false;
						}

						if (
							onScrollDown &&
							offsetY > 12 &&
							!hasTriggeredScrollDownRef.current
						) {
							hasTriggeredScrollDownRef.current = true;
							onScrollDown();
						}

						if (
							onPullDown &&
							offsetY < -26 &&
							!hasTriggeredPullDownRef.current
						) {
							hasTriggeredPullDownRef.current = true;
							onPullDown();
						}
					}}
					scrollEventThrottle={16}
				>
					<View className="flex-row flex-wrap justify-between">
						{memories.map((memory) => (
							<MemoryThumbnail key={memory.id} memory={memory} />
						))}
					</View>
				</ScrollView>
			) : null}
		</View>
	);
}
