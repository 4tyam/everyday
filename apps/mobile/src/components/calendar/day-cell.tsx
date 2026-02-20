import { Image, Pressable, Text, View } from "react-native";

type DayCellProps = {
	day: number;
	memoryPreviewUris: string[];
	isSelected: boolean;
	isToday: boolean;
	onPress: () => void;
	textColor: string;
	todayCircleColor: string;
	selectedDayBackgroundColor: string;
};

function mockColorFromUri(uri: string): string {
	let hash = 0;
	for (let i = 0; i < uri.length; i += 1) {
		hash = (hash << 5) - hash + uri.charCodeAt(i);
		hash |= 0;
	}
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 55%, 72%)`;
}

export function DayCell({
	day,
	memoryPreviewUris,
	isSelected,
	isToday,
	onPress,
	textColor,
	todayCircleColor,
	selectedDayBackgroundColor,
}: DayCellProps) {
	const showDots = memoryPreviewUris.length > 0;
	const isHighlighted = isToday || isSelected;
	const dotSize = isHighlighted ? 4 : 5;
	const dotTopMargin = isHighlighted ? 1 : -2;
	const dotHorizontalMargin = isHighlighted ? 1.5 : 2;

	return (
		<Pressable className="flex-1 items-center justify-center" onPress={onPress}>
			<View className="items-center justify-center">
				<View
					className="items-center justify-center rounded-full"
					style={
						isSelected
							? {
									height: 42,
									width: 42,
									borderRadius: 21,
									backgroundColor: selectedDayBackgroundColor,
								}
							: isToday
								? {
										height: 40,
										width: 40,
										borderRadius: 20,
										borderWidth: 1.5,
										borderColor: todayCircleColor,
									}
								: { height: 40, width: 40, borderRadius: 20 }
					}
				>
					<Text
						className="font-semibold"
						style={{
							color: textColor,
							fontSize: 18,
							lineHeight: 20,
						}}
					>
						{day}
					</Text>
				</View>

				<View
					className="flex-row items-center justify-center"
					style={{ height: 7, marginTop: dotTopMargin }}
				>
					{showDots
						? memoryPreviewUris.slice(0, 3).map((uri, index) => {
								if (uri.startsWith("mock://")) {
									return (
										<View
											key={`dot-${day}-${index}`}
											className="rounded-full"
											style={{
												width: dotSize,
												height: dotSize,
												marginHorizontal: dotHorizontalMargin,
												backgroundColor: mockColorFromUri(uri),
											}}
										/>
									);
								}

								return (
									<Image
										key={`dot-${day}-${index}`}
										source={{ uri }}
										style={{
											width: dotSize,
											height: dotSize,
											marginHorizontal: dotHorizontalMargin,
											borderRadius: dotSize / 2,
											backgroundColor: todayCircleColor,
										}}
									/>
								);
							})
						: null}
				</View>
			</View>
		</Pressable>
	);
}
