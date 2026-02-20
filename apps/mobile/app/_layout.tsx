import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	DynamicColorIOS,
	Platform,
	View,
} from "react-native";
import { AuthScreen } from "../src/components/auth-screen";
import { AuthProvider, useAuth } from "../src/context/auth-context";
import { initializeMemoriesDb } from "../src/features/memories/local-db";
import { getTheme } from "../src/theme/colors";

const tintColor =
	Platform.OS === "ios"
		? DynamicColorIOS({ light: "#0a84ff", dark: "#5ac8fa" })
		: "#0a84ff";

const labelColor =
	Platform.OS === "ios"
		? DynamicColorIOS({ light: "#1c1c1e", dark: "#f2f2f7" })
		: "#1c1c1e";

function AppShell() {
	const { user, isLoading } = useAuth();
	const [skipAuth, setSkipAuth] = useState(false);
	const theme = getTheme(null);

	if (isLoading) {
		return (
			<View
				className="flex-1 items-center justify-center"
				style={{ backgroundColor: theme.background }}
			>
				<ActivityIndicator size="large" color={theme.accent} />
			</View>
		);
	}

	if (!user && !skipAuth) {
		return <AuthScreen onSkip={() => setSkipAuth(true)} />;
	}

	return (
		<NativeTabs
			blurEffect="systemChromeMaterial"
			tintColor={tintColor}
			labelStyle={{ color: labelColor, fontSize: 11 }}
		>
			<NativeTabs.Trigger name="index">
				<Icon sf={{ default: "house", selected: "house.fill" }} />
				<Label>Home</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="trips">
				<Icon sf={{ default: "airplane", selected: "airplane" }} />
				<Label>Trips</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="today">
				<Icon sf={{ default: "list.bullet", selected: "list.bullet" }} />
				<Label>Today</Label>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="settings">
				<Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
				<Label>Settings</Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}

export default function RootLayout() {
	const [queryClient] = useState(() => new QueryClient());

	useEffect(() => {
		void initializeMemoriesDb();
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<StatusBar style="auto" />
				<AppShell />
			</AuthProvider>
		</QueryClientProvider>
	);
}
