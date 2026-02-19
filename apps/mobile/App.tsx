import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { apiHealthSchema, type ApiHealth, SERVICE_NAME } from "shared";

type HealthState = {
  data: ApiHealth | null;
  error: string | null;
  loading: boolean;
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function App() {
  const [state, setState] = useState<HealthState>({
    data: null,
    error: null,
    loading: true
  });

  const healthUrl = useMemo(() => `${apiBaseUrl}/health`, []);

  const loadHealth = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(healthUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const parsed = apiHealthSchema.safeParse(json);

      if (!parsed.success) {
        throw new Error("Invalid /health response shape");
      }

      setState({ data: parsed.data, error: null, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState({ data: null, error: message, loading: false });
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Everyday Mobile</Text>
        <Text style={styles.text}>Shared service: {SERVICE_NAME}</Text>
        <Text style={styles.text}>API URL: {apiBaseUrl}</Text>

        {state.loading && <ActivityIndicator size="small" />}

        {state.error && <Text style={[styles.text, styles.error]}>Health check failed: {state.error}</Text>}

        {state.data && (
          <View style={styles.section}>
            <Text style={styles.text}>ok: {String(state.data.ok)}</Text>
            <Text style={styles.text}>service: {state.data.service}</Text>
            <Text style={styles.text}>time: {state.data.time}</Text>
          </View>
        )}

        <Pressable style={styles.button} onPress={loadHealth}>
          <Text style={styles.buttonText}>Refresh health</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    justifyContent: "center",
    padding: 20
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 20,
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  section: {
    gap: 6
  },
  text: {
    fontSize: 16
  },
  error: {
    color: "#d33"
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600"
  }
});
