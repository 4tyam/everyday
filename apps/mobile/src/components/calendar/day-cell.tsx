import { Pressable, Text, View } from "react-native";

type DayCellProps = {
	day: number;
	memoryPreviewColors: string[];
	hasMemories: boolean;
	isSelected: boolean;
	isToday: boolean;
	onPress: () => void;
	textColor: string;
	todayCircleColor: string;
	selectedDayBackgroundColor: string;
};

export function DayCell({
	day,
	memoryPreviewColors,
	hasMemories,
	isSelected,
	isToday,
	onPress,
	textColor,
	todayCircleColor,
	selectedDayBackgroundColor,
}: DayCellProps) {
	const showDots = memoryPreviewColors.length > 0;
	const isDisabled = !hasMemories;
	const isHighlighted = isToday || isSelected;
	const dotSize = isHighlighted ? 4 : 5;
	const dotTopMargin = isHighlighted ? 1 : -2;
	const dotHorizontalMargin = isHighlighted ? 1.5 : 2;

	return (
		<Pressable
			className="flex-1 items-center justify-center"
			onPress={onPress}
			disabled={isDisabled}
			style={{ opacity: isDisabled ? 0.45 : 1 }}
		>
			<View className="items-center justify-center">
				<View
					className="items-center justify-center rounded-full"
					style={
						isDisabled
							? { height: 40, width: 40, borderRadius: 20 }
							: isSelected
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
						? memoryPreviewColors.slice(0, 3).map((color, index) => {
								const safeColor =
									typeof color === "string" && color.trim().length > 0
										? color
										: todayCircleColor;
								return (
									<View
										key={`dot-${day}-${index}`}
										className="rounded-full"
										style={{
											width: dotSize,
											height: dotSize,
											marginHorizontal: dotHorizontalMargin,
											backgroundColor: safeColor,
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
