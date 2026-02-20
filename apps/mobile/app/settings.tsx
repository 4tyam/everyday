import Constants from "expo-constants";
import { useMemo, useState } from "react";
import {
	Platform,
	ScrollView,
	Switch,
	Text,
	View,
	useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTheme } from "../src/theme/colors";

type SwiftUIModule = typeof import("@expo/ui/swift-ui");

function loadSwiftUI(): SwiftUIModule | null {
	try {
		return require("@expo/ui/swift-ui") as SwiftUIModule;
	} catch {
		return null;
	}
}

export default function SettingsTab() {
	const [notifications, setNotifications] = useState(true);
	const [isDemoSheetOpen, setIsDemoSheetOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedFocusIndex, setSelectedFocusIndex] = useState<number | null>(
		1,
	);
	const [focusLevel, setFocusLevel] = useState(0.45);
	const theme = getTheme(useColorScheme());
	const canUseExpoUI =
		Platform.OS === "ios" && Constants.executionEnvironment !== "storeClient";
	const swiftUI = useMemo(
		() => (canUseExpoUI ? loadSwiftUI() : null),
		[canUseExpoUI],
	);

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: theme.background }}
		>
			<ScrollView contentContainerClassName="px-5 pb-10 pt-8">
				<Text
					className="text-[34px] font-bold tracking-[-0.5px]"
					style={{ color: theme.textPrimary }}
				>
					Settings
				</Text>
				<Text
					className="mt-1 text-[15px]"
					style={{ color: theme.textTertiary }}
				>
					Keep things simple.
				</Text>

				<View
					className="mt-5 rounded-2xl p-4"
					style={{ backgroundColor: theme.card }}
				>
					<View className="flex-row items-center justify-between">
						<Text
							className="text-[16px]"
							style={{ color: theme.textSecondary }}
						>
							Daily reminders
						</Text>
						{swiftUI ? (
							<swiftUI.Host
								matchContents
								style={{ minHeight: 32, minWidth: 52 }}
							>
								<swiftUI.Switch
									value={notifications}
									onValueChange={setNotifications}
								/>
							</swiftUI.Host>
						) : (
							<Switch value={notifications} onValueChange={setNotifications} />
						)}
					</View>
				</View>

				<View
					className="mt-3 rounded-2xl p-4"
					style={{ backgroundColor: theme.card }}
				>
					<Text className="text-[13px]" style={{ color: theme.textTertiary }}>
						Expo UI native controls are enabled on iOS development builds.
					</Text>
				</View>

				<View
					className="mt-3 rounded-2xl p-4"
					style={{ backgroundColor: theme.card }}
				>
					<Text
						className="mb-3 text-[13px] font-semibold"
						style={{ color: theme.accentMuted }}
					>
						Expo UI Demo
					</Text>
					{swiftUI ? (
						<View className="gap-3">
							<swiftUI.Host matchContents style={{ minHeight: 44 }}>
								<swiftUI.Button
									variant="bordered"
									onPress={() => setIsDemoSheetOpen(true)}
								>
									Open bottom sheet
								</swiftUI.Button>
							</swiftUI.Host>

							<swiftUI.Host matchContents style={{ minHeight: 210 }}>
								<swiftUI.DateTimePicker
									title="Pick a date"
									initialDate={selectedDate.toISOString()}
									variant="graphical"
									displayedComponents="date"
									onDateSelected={setSelectedDate}
								/>
							</swiftUI.Host>

							<swiftUI.Host matchContents style={{ minHeight: 44 }}>
								<swiftUI.Picker
									label="Focus mode"
									options={["Light", "Balanced", "Deep"]}
									selectedIndex={selectedFocusIndex}
									variant="segmented"
									onOptionSelected={(event) =>
										setSelectedFocusIndex(event.nativeEvent.index)
									}
								/>
							</swiftUI.Host>

							<swiftUI.Host matchContents style={{ minHeight: 56 }}>
								<swiftUI.Slider
									value={focusLevel}
									min={0}
									max={1}
									onValueChange={setFocusLevel}
									color={theme.accent}
								/>
							</swiftUI.Host>

							<swiftUI.Host matchContents style={{ minHeight: 12 }}>
								<swiftUI.LinearProgress
									progress={focusLevel}
									color={theme.accent}
								/>
							</swiftUI.Host>

							<swiftUI.Host matchContents>
								<swiftUI.BottomSheet
									isOpened={isDemoSheetOpen}
									onIsOpenedChange={setIsDemoSheetOpen}
									presentationDetents={["medium", "large"]}
									presentationDragIndicator="visible"
								>
									<swiftUI.Text size={17} weight="semibold">
										Native bottom sheet preview
									</swiftUI.Text>
								</swiftUI.BottomSheet>
							</swiftUI.Host>
						</View>
					) : (
						<Text className="text-[14px]" style={{ color: theme.textTertiary }}>
							Open this in an iOS development build to preview Expo UI controls
							like bottom sheets and date pickers.
						</Text>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
