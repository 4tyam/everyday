import { Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageCalendar } from "../src/components/image-calendar";
import { getTheme } from "../src/theme/colors";

export default function HomeTab() {
	const theme = getTheme(useColorScheme());

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: theme.background }}
		>
			<View className="flex-1 px-3 pb-10 pt-2">
				<Text
					className="mb-4 text-center text-[22px] font-semibold"
					style={{ color: theme.textPrimary }}
				>
					everyday
				</Text>
				<ImageCalendar />
			</View>
		</SafeAreaView>
	);
}
