import Constants from "expo-constants";
import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	Pressable,
	ScrollView,
	Switch,
	Text,
	TextInput,
	useColorScheme,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "./src/lib/auth";
import { useAuth } from "./src/context/auth-context";
import { getTheme } from "./src/theme/colors";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? "everyday";
const signedInRedirectUrl = `${appScheme}://auth/success`;

type SwiftUIModule = typeof import("@expo/ui/swift-ui");

function loadSwiftUI(): SwiftUIModule | null {
	try {
		return require("@expo/ui/swift-ui") as SwiftUIModule;
	} catch {
		return null;
	}
}

export default function HomeScreen() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [notifications, setNotifications] = useState(true);
	const [actionError, setActionError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [isDemoSheetOpen, setIsDemoSheetOpen] = useState(false);
	const [selectedFocusIndex, setSelectedFocusIndex] = useState<number | null>(
		1,
	);
	const [screen, setScreen] = useState<"auth" | "home">("auth");
	const theme = getTheme(useColorScheme());

	const { user, isLoading, error: sessionError, refetch, signOut } = useAuth();
	const isBusy = isLoading || actionLoading;
	const canUseExpoUI =
		Platform.OS === "ios" && Constants.executionEnvironment !== "storeClient";
	const swiftUI = useMemo(
		() => (canUseExpoUI ? loadSwiftUI() : null),
		[canUseExpoUI],
	);

	useEffect(() => {
		if (user) {
			setScreen("home");
			return;
		}

		setScreen("auth");
	}, [user]);

	const onSignUp = async () => {
		setActionError(null);
		setActionLoading(true);

		const response = await authClient.signUp.email({
			name,
			email,
			password,
		});

		if (response.error) {
			setActionError(response.error.message ?? "Sign up failed");
			setActionLoading(false);
			return;
		}

		await refetch();
		setActionLoading(false);
	};

	const onSignIn = async () => {
		setActionError(null);
		setActionLoading(true);

		const response = await authClient.signIn.email({
			email,
			password,
		});

		if (response.error) {
			setActionError(response.error.message ?? "Sign in failed");
			setActionLoading(false);
			return;
		}

		await refetch();
		setActionLoading(false);
	};

	const onSignOut = async () => {
		setActionError(null);
		setActionLoading(true);

		const response = await signOut();
		if (response.error) {
			setActionError(response.error.message ?? "Sign out failed");
			setActionLoading(false);
			return;
		}

		await refetch();
		setActionLoading(false);
	};

	const onGoogleSignIn = async () => {
		setActionError(null);
		setActionLoading(true);

		const response = await authClient.signIn.social({
			provider: "google",
			callbackURL: signedInRedirectUrl,
			newUserCallbackURL: signedInRedirectUrl,
		});

		if (response.error) {
			setActionError(response.error.message ?? "Google sign in failed");
			setActionLoading(false);
			return;
		}

		await refetch();
		setActionLoading(false);
	};

	return (
		<SafeAreaView
			className="flex-1"
			style={{ backgroundColor: theme.background }}
		>
			<ScrollView
				contentContainerClassName="flex-grow px-5 pb-10 pt-8"
				keyboardShouldPersistTaps="handled"
			>
				<View className="mb-6 gap-1">
					<Text
						className="text-[34px] font-bold tracking-[-0.5px]"
						style={{ color: theme.textPrimary }}
					>
						Welcome
					</Text>
					<Text className="text-[15px]" style={{ color: theme.textTertiary }}>
						Sign in to Everyday.
					</Text>
				</View>

				<View
					className="mb-4 rounded-2xl p-4"
					style={{ backgroundColor: theme.card }}
				>
					<Text
						className="text-[12px] font-semibold uppercase tracking-[0.8px]"
						style={{ color: theme.accentMuted }}
					>
						Auth Endpoint
					</Text>
					<Text
						className="mt-1 text-[14px]"
						style={{ color: theme.textSecondary }}
					>
						{apiBaseUrl}/api/auth
					</Text>
				</View>

				{isBusy && (
					<View
						className="mb-4 rounded-2xl p-4"
						style={{ backgroundColor: theme.card }}
					>
						<View className="flex-row items-center gap-2">
							<ActivityIndicator size="small" color={theme.accent} />
							<Text
								className="text-[14px]"
								style={{ color: theme.textTertiary }}
							>
								Processing...
							</Text>
						</View>
					</View>
				)}

				{!!sessionError && (
					<View
						className="mb-4 rounded-2xl p-4"
						style={{ backgroundColor: theme.card }}
					>
						<Text className="text-[14px]" style={{ color: theme.error }}>
							Session error: {sessionError.message ?? "Could not read session"}
						</Text>
					</View>
				)}

				{!!actionError && (
					<View
						className="mb-4 rounded-2xl p-4"
						style={{ backgroundColor: theme.card }}
					>
						<Text className="text-[14px]" style={{ color: theme.error }}>
							Auth error: {actionError}
						</Text>
					</View>
				)}

				{screen === "home" && user ? (
					<View className="gap-4">
						<View
							className="rounded-2xl p-4"
							style={{ backgroundColor: theme.card }}
						>
							<Text
								className="mb-1 text-[12px] font-semibold uppercase tracking-[0.8px]"
								style={{ color: theme.accentMuted }}
							>
								Signed In
							</Text>
							<Text
								className="text-[17px] font-semibold"
								style={{ color: theme.textSecondary }}
							>
								{user.email}
							</Text>
							<Text
								className="mt-2 text-[13px]"
								style={{ color: theme.textTertiary }}
							>
								ID: {user.id}
							</Text>
						</View>
						<View className="flex-row gap-2.5">
							<Pressable
								className="flex-1 items-center justify-center rounded-xl py-3 active:opacity-80"
								style={{ backgroundColor: theme.card }}
								disabled={isBusy}
								onPress={() => refetch()}
							>
								<Text
									className="text-[15px] font-medium"
									style={{ color: theme.accent }}
								>
									Refresh
								</Text>
							</Pressable>
							<Pressable
								className="flex-1 items-center justify-center rounded-xl py-3 active:opacity-80"
								style={{ backgroundColor: theme.card }}
								disabled={isBusy}
								onPress={onSignOut}
							>
								<Text
									className="text-[15px] font-medium"
									style={{ color: theme.destructive }}
								>
									Sign out
								</Text>
							</Pressable>
						</View>
					</View>
				) : (
					<>
						<View
							className="rounded-2xl p-4"
							style={{ backgroundColor: theme.card }}
						>
							<Text
								className="mb-3 text-[13px] font-semibold"
								style={{ color: theme.accentMuted }}
							>
								Email & Password
							</Text>

							{swiftUI ? (
								<View className="gap-2.5">
									<swiftUI.Host
										matchContents
										style={{ minHeight: 44, justifyContent: "center" }}
									>
										<swiftUI.TextField
											key={`name-${screen}`}
											defaultValue={name}
											placeholder="Name"
											onChangeText={setName}
										/>
									</swiftUI.Host>
									<View
										className="h-px"
										style={{ backgroundColor: theme.separator }}
									/>
									<swiftUI.Host
										matchContents
										style={{ minHeight: 44, justifyContent: "center" }}
									>
										<swiftUI.TextField
											key={`email-${screen}`}
											defaultValue={email}
											placeholder="Email"
											keyboardType="email-address"
											onChangeText={setEmail}
										/>
									</swiftUI.Host>
									<View
										className="h-px"
										style={{ backgroundColor: theme.separator }}
									/>
									<swiftUI.Host
										matchContents
										style={{ minHeight: 44, justifyContent: "center" }}
									>
										<swiftUI.TextField
											key={`password-${screen}`}
											defaultValue={password}
											placeholder="Password"
											onChangeText={setPassword}
										/>
									</swiftUI.Host>
								</View>
							) : (
								<View className="gap-2.5">
									<TextInput
										autoCapitalize="words"
										placeholder="Name"
										placeholderTextColor={theme.accentMuted}
										className="rounded-xl border px-3 py-2.5 text-[16px]"
										style={{
											borderColor: theme.border,
											color: theme.textSecondary,
										}}
										value={name}
										onChangeText={setName}
									/>
									<TextInput
										autoCapitalize="none"
										autoComplete="email"
										keyboardType="email-address"
										placeholder="Email"
										placeholderTextColor={theme.accentMuted}
										className="rounded-xl border px-3 py-2.5 text-[16px]"
										style={{
											borderColor: theme.border,
											color: theme.textSecondary,
										}}
										value={email}
										onChangeText={setEmail}
									/>
									<TextInput
										autoCapitalize="none"
										autoComplete="password"
										secureTextEntry
										placeholder="Password"
										placeholderTextColor={theme.accentMuted}
										className="rounded-xl border px-3 py-2.5 text-[16px]"
										style={{
											borderColor: theme.border,
											color: theme.textSecondary,
										}}
										value={password}
										onChangeText={setPassword}
									/>
								</View>
							)}
						</View>

						{swiftUI ? (
							<View className="mt-4 gap-2.5">
								<swiftUI.Host matchContents style={{ minHeight: 44 }}>
									<swiftUI.Button
										variant="borderedProminent"
										disabled={isBusy}
										onPress={onSignUp}
									>
										Create account
									</swiftUI.Button>
								</swiftUI.Host>
								<swiftUI.Host matchContents style={{ minHeight: 44 }}>
									<swiftUI.Button
										variant="bordered"
										disabled={isBusy}
										onPress={onSignIn}
									>
										Sign in
									</swiftUI.Button>
								</swiftUI.Host>
								<swiftUI.Host matchContents style={{ minHeight: 44 }}>
									<swiftUI.Button
										variant="glassProminent"
										disabled={isBusy}
										onPress={onGoogleSignIn}
									>
										Continue with Google
									</swiftUI.Button>
								</swiftUI.Host>
							</View>
						) : (
							<View className="mt-4 gap-2.5">
								<Pressable
									className="items-center rounded-xl py-3 active:opacity-80"
									style={{ backgroundColor: theme.accent }}
									disabled={isBusy}
									onPress={onSignUp}
								>
									<Text className="text-[15px] font-semibold text-white">
										Create account
									</Text>
								</Pressable>
								<Pressable
									className="items-center rounded-xl py-3 active:opacity-80"
									style={{ backgroundColor: theme.card }}
									disabled={isBusy}
									onPress={onSignIn}
								>
									<Text
										className="text-[15px] font-medium"
										style={{ color: theme.accent }}
									>
										Sign in
									</Text>
								</Pressable>
								<Pressable
									className="items-center rounded-xl py-3 active:opacity-80"
									style={{ backgroundColor: theme.card }}
									disabled={isBusy}
									onPress={onGoogleSignIn}
								>
									<Text
										className="text-[15px] font-medium"
										style={{ color: theme.textSecondary }}
									>
										Continue with Google
									</Text>
								</Pressable>
							</View>
						)}
					</>
				)}

				<View
					className="mt-8 mb-3 h-px"
					style={{ backgroundColor: theme.separator }}
				/>

				<View className="gap-1">
					<Text
						className="text-[28px] font-bold tracking-[-0.4px]"
						style={{ color: theme.textPrimary }}
					>
						Settings
					</Text>
					<Text
						className="text-[15px]"
						style={{ color: theme.textTertiary }}
					>
						Keep things simple.
					</Text>
				</View>

				<View
					className="mt-5 rounded-2xl p-4"
					style={{ backgroundColor: theme.card }}
				>
					<View className="flex-row items-center justify-between">
						<Text className="text-[16px]" style={{ color: theme.textSecondary }}>
							Daily reminders
						</Text>
						{swiftUI ? (
							<swiftUI.Host matchContents style={{ minHeight: 32, minWidth: 52 }}>
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
									variant="glass"
									onPress={() => setIsDemoSheetOpen(true)}
								>
									Open bottom sheet
								</swiftUI.Button>
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
