import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
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
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Everyday Auth</Text>
        <Text style={styles.text}>Auth base: {apiBaseUrl}/api/auth</Text>

        {(isLoading || actionLoading) && <ActivityIndicator size="small" />}

        {!!sessionError && (
          <Text style={[styles.text, styles.error]}>
            Session error: {sessionError.message ?? "Could not read session"}
          </Text>
        )}

        {!!actionError && (
          <Text style={[styles.text, styles.error]}>
            Auth error: {actionError}
          </Text>
        )}

        {screen === "home" && user ? (
          <View style={styles.section}>
            <Text style={styles.text}>Signed in as</Text>
            <Text style={styles.textStrong}>{user.email}</Text>
            <Text style={styles.text}>userId: {user.id}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <TextInput
              autoCapitalize="words"
              placeholder="Name"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              secureTextEntry
              placeholder="Password"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <Pressable style={styles.button} onPress={onSignUp}>
              <Text style={styles.buttonText}>Sign up with email</Text>
            </Pressable>
            <Pressable style={styles.formButtonSecondary} onPress={onSignIn}>
              <Text style={styles.formButtonSecondaryText}>
                Sign in with email
              </Text>
            </Pressable>
            <Pressable style={styles.googleButton} onPress={onGoogleSignIn}>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.row}>
          <Pressable
            style={styles.rowButtonSecondary}
            onPress={() => refetch()}
          >
            <Text style={styles.rowButtonSecondaryText}>Refresh session</Text>
          </Pressable>
          <Pressable style={styles.buttonDanger} onPress={onSignOut}>
            <Text style={styles.buttonText}>Sign out</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  section: {
    gap: 10,
  },
  text: {
    fontSize: 16,
  },
  textStrong: {
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#d33",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  formButtonSecondary: {
    backgroundColor: "#ffffff",
    borderColor: "#111827",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  formButtonSecondaryText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  rowButtonSecondary: {
    backgroundColor: "#ffffff",
    borderColor: "#111827",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  rowButtonSecondaryText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDanger: {
    backgroundColor: "#991b1b",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    flex: 1,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderColor: "#2563eb",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    color: "#1d4ed8",
    fontSize: 16,
    fontWeight: "600",
  },
});
