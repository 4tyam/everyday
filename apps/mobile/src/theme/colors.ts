import { type ColorSchemeName } from "react-native";

export type AppTheme = {
	background: string;
	card: string;
	textPrimary: string;
	textSecondary: string;
	textTertiary: string;
	border: string;
	separator: string;
	accent: string;
	accentMuted: string;
	destructive: string;
	error: string;
};

const lightTheme: AppTheme = {
	background: "#ffffff",
	card: "#ffffff",
	textPrimary: "#111111",
	textSecondary: "#1c1c1e",
	textTertiary: "#6e6e73",
	border: "#e5e5ea",
	separator: "#ebebf0",
	accent: "#0a84ff",
	accentMuted: "#8e8e93",
	destructive: "#ff3b30",
	error: "#b42318",
};

const darkTheme: AppTheme = {
	background: "#1c1c1e",
	card: "#1c1c1e",
	textPrimary: "#f2f2f7",
	textSecondary: "#ffffff",
	textTertiary: "#a1a1a6",
	border: "#3a3a3c",
	separator: "#38383a",
	accent: "#5ac8fa",
	accentMuted: "#8e8e93",
	destructive: "#ff6961",
	error: "#ff8a80",
};

export function getTheme(colorScheme: ColorSchemeName): AppTheme {
	return colorScheme === "dark" ? darkTheme : lightTheme;
}
