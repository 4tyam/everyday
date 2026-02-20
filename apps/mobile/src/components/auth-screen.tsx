import { useState } from "react";
import {
	ActivityIndicator,
	Image,
	ImageBackground,
	Pressable,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/auth-context";
import { authClient } from "../lib/auth";

const authBg = require("../assets/images/auth-bg.png");
const appleLogo = require("../assets/icons/apple-logo.png");
const googleLogo = require("../assets/icons/google-logo.png");

const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? "everyday";
const signedInRedirectUrl = `${appScheme}://auth/success`;

type Provider = "apple" | "google";

type AuthScreenProps = {
	onSkip?: () => void;
};

export function AuthScreen({ onSkip }: AuthScreenProps) {
	const [actionLoading, setActionLoading] = useState(false);
	const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const { isLoading, error: sessionError, refetch } = useAuth();

	const isBusy = isLoading || actionLoading;

	const onSocialSignIn = async (provider: Provider) => {
		setActionError(null);
		setPendingProvider(provider);
		setActionLoading(true);

		const response = await authClient.signIn.social({
			provider,
			callbackURL: signedInRedirectUrl,
			newUserCallbackURL: signedInRedirectUrl,
		});

		if (response.error) {
			setActionError(response.error.message ?? `${provider} sign in failed`);
			setActionLoading(false);
			setPendingProvider(null);
			return;
		}

		await refetch();
		setActionLoading(false);
		setPendingProvider(null);
	};

	return (
		<ImageBackground source={authBg} resizeMode="cover" style={{ flex: 1 }}>
			<SafeAreaView style={{ flex: 1 }}>
				<View style={{ flex: 1, paddingHorizontal: 28, paddingBottom: 24 }}>
					<View style={{ marginTop: 72, alignItems: "center" }}>
						<Text
							style={{
								fontSize: 56,
								fontWeight: "700",
								color: "#111827",
								letterSpacing: -1.5,
								textAlign: "center",
							}}
						>
							everyday
						</Text>
					</View>

					<View style={{ marginTop: "auto" }}>
						{!!sessionError && (
							<Text className="mb-3 text-center text-[13px] text-white/90">
								{sessionError.message ?? "Could not read session"}
							</Text>
						)}
						{!!actionError && (
							<Text className="mb-3 text-center text-[13px] text-white/90">
								{actionError}
							</Text>
						)}

						<View style={{ width: "100%" }}>
							<Pressable
								style={{
									alignSelf: "center",
									marginBottom: 10,
									paddingHorizontal: 14,
									paddingVertical: 7,
									borderRadius: 999,
									backgroundColor: "rgba(255, 255, 255, 0.24)",
								}}
								onPress={onSkip}
								disabled={isBusy}
							>
								<Text className="text-[14px] font-semibold text-white">
									Skip
								</Text>
							</Pressable>

							<Pressable
								style={{
									height: 54,
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									borderRadius: 999,
									backgroundColor: "#ffffff",
								}}
								onPress={() => onSocialSignIn("apple")}
								disabled={isBusy}
							>
								{actionLoading && pendingProvider === "apple" ? (
									<ActivityIndicator size="small" color="#111111" />
								) : (
									<>
										<Image
											source={appleLogo}
											style={{
												width: 18,
												height: 18,
												marginRight: 10,
												tintColor: "#111111",
											}}
											resizeMode="contain"
										/>
										<Text className="text-[17px] font-medium text-[#111111]">
											Continue with Apple
										</Text>
									</>
								)}
							</Pressable>

							<Pressable
								style={{
									marginTop: 12,
									height: 54,
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "center",
									borderRadius: 999,
									backgroundColor: "#ffffff",
								}}
								onPress={() => onSocialSignIn("google")}
								disabled={isBusy}
							>
								{actionLoading && pendingProvider === "google" ? (
									<ActivityIndicator size="small" color="#111111" />
								) : (
									<>
										<Image
											source={googleLogo}
											style={{ width: 18, height: 18, marginRight: 10 }}
											resizeMode="contain"
										/>
										<Text className="text-[17px] font-medium text-[#111111]">
											Continue with Google
										</Text>
									</>
								)}
							</Pressable>
						</View>
					</View>
				</View>
			</SafeAreaView>
		</ImageBackground>
	);
}
