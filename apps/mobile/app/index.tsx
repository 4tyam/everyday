import { ImageBackground, Text, View, useColorScheme } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageCalendar } from "../src/components/image-calendar";
import { getTheme } from "../src/theme/colors";

const authBg = require("../src/assets/images/auth-bg.png");
const authBgDark = require("../src/assets/images/auth-bg-dark.png");

function hexToRgba(hex: string, alpha: number): string {
	const normalized = hex.replace("#", "");
	if (normalized.length !== 6) {
		return `rgba(255,255,255,${alpha})`;
	}
	const r = Number.parseInt(normalized.slice(0, 2), 16);
	const g = Number.parseInt(normalized.slice(2, 4), 16);
	const b = Number.parseInt(normalized.slice(4, 6), 16);
	return `rgba(${r},${g},${b},${alpha})`;
}

export default function HomeTab() {
	const colorScheme = useColorScheme();
	const theme = getTheme(colorScheme);
	const backgroundImage = colorScheme === "dark" ? authBgDark : authBg;

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: theme.background }}
		>
			<View
				pointerEvents="none"
				style={{
					position: "absolute",
					top: -36,
					left: 0,
					right: 0,
					height: 245,
				}}
			>
				<ImageBackground
					source={backgroundImage}
					resizeMode="cover"
					imageStyle={{ transform: [{ rotate: "180deg" }] }}
					style={{ flex: 1 }}
				/>
				<LinearGradient
					colors={[hexToRgba(theme.background, 0), theme.background]}
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						bottom: 0,
						height: 100,
					}}
				/>
			</View>
			<View className="flex-1 pb-10 pt-2">
				<View className="px-3">
					<Text
						className="mb-4 text-center text-[22px] font-semibold"
						style={{ color: theme.textPrimary }}
					>
						everyday
					</Text>
				</View>
				<ImageCalendar />
			</View>
		</SafeAreaView>
	);
}
