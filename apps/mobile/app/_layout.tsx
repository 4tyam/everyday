import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { StatusBar } from "expo-status-bar";
import { DynamicColorIOS, Platform } from "react-native";
import { AuthProvider } from "../src/context/auth-context";

const tintColor =
	Platform.OS === "ios"
		? DynamicColorIOS({ light: "#0a84ff", dark: "#5ac8fa" })
		: "#0a84ff";

const labelColor =
	Platform.OS === "ios"
		? DynamicColorIOS({ light: "#1c1c1e", dark: "#f2f2f7" })
		: "#1c1c1e";

export default function RootLayout() {
	return (
		<AuthProvider>
			<StatusBar style="auto" />
			<NativeTabs
				blurEffect="systemChromeMaterial"
				tintColor={tintColor}
				labelStyle={{ color: labelColor, fontSize: 11 }}
			>
				<NativeTabs.Trigger name="index">
					<Icon sf={{ default: "house", selected: "house.fill" }} />
					<Label>Home</Label>
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
		</AuthProvider>
	);
}
