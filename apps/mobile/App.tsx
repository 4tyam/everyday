import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	SafeAreaView,
	Text,
	TextInput,
	View,
} from "react-native";
import { authClient } from "./src/lib/auth";
import { AuthProvider, useAuth } from "./src/context/auth-context";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? "everyday";
const signedInRedirectUrl = `${appScheme}://auth/success`;

function AppContent() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [screen, setScreen] = useState<"auth" | "home">("auth");

	const { user, isLoading, error: sessionError, refetch, signOut } = useAuth();

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
		<SafeAreaView className="flex-1 justify-center bg-slate-100 p-5">
			<View className="gap-3 rounded-2xl bg-white p-5">
				<Text className="text-3xl font-bold text-slate-900">Everyday Auth</Text>
				<Text className="text-base text-slate-700">
					Auth base: {apiBaseUrl}/api/auth
				</Text>

				{(isLoading || actionLoading) && <ActivityIndicator size="small" />}

				{!!sessionError && (
					<Text className="text-base text-red-700">
						Session error: {sessionError.message ?? "Could not read session"}
					</Text>
				)}

				{!!actionError && (
					<Text className="text-base text-red-700">
						Auth error: {actionError}
					</Text>
				)}

				{screen === "home" && user ? (
					<View className="gap-2.5">
						<Text className="text-base text-slate-700">Signed in as</Text>
						<Text className="text-base font-semibold text-slate-900">
							{user.email}
						</Text>
						<Text className="text-base text-slate-700">userId: {user.id}</Text>
					</View>
				) : (
					<View className="gap-2.5">
						<TextInput
							autoCapitalize="words"
							placeholder="Name"
							className="rounded-xl border border-slate-300 px-3 py-2.5"
							value={name}
							onChangeText={setName}
						/>
						<TextInput
							autoCapitalize="none"
							autoComplete="email"
							keyboardType="email-address"
							placeholder="Email"
							className="rounded-xl border border-slate-300 px-3 py-2.5"
							value={email}
							onChangeText={setEmail}
						/>
						<TextInput
							autoCapitalize="none"
							autoComplete="password"
							secureTextEntry
							placeholder="Password"
							className="rounded-xl border border-slate-300 px-3 py-2.5"
							value={password}
							onChangeText={setPassword}
						/>

						<Pressable
							className="items-center rounded-xl bg-slate-900 py-2.5"
							onPress={onSignUp}
						>
							<Text className="font-semibold text-white">
								Sign up with email
							</Text>
						</Pressable>
						<Pressable
							className="items-center justify-center rounded-xl border border-slate-900 bg-white py-2.5"
							onPress={onSignIn}
						>
							<Text className="text-base font-semibold text-slate-900">
								Sign in with email
							</Text>
						</Pressable>
						<Pressable
							className="items-center justify-center rounded-xl border border-blue-600 bg-white py-2.5"
							onPress={onGoogleSignIn}
						>
							<Text className="text-base font-semibold text-blue-700">
								Continue with Google
							</Text>
						</Pressable>
					</View>
				)}

				<View className="flex-row gap-2.5">
					<Pressable
						className="flex-1 items-center justify-center rounded-xl border border-slate-900 bg-white py-2.5"
						onPress={() => refetch()}
					>
						<Text className="text-base font-semibold text-slate-900">
							Refresh session
						</Text>
					</Pressable>
					<Pressable
						className="flex-1 items-center rounded-xl bg-red-800 py-2.5"
						onPress={onSignOut}
					>
						<Text className="font-semibold text-white">Sign out</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<AppContent />
		</AuthProvider>
	);
}
