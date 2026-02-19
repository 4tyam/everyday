import { authClient } from "../lib/auth";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";

type AuthContextValue = {
  session: ReturnType<typeof authClient.useSession>["data"];
  user: ReturnType<typeof authClient.useSession>["data"] extends
    | { user: infer TUser }
    | null
    ? TUser | null
    : null;
  isLoading: boolean;
  error: ReturnType<typeof authClient.useSession>["error"];
  refetch: ReturnType<typeof authClient.useSession>["refetch"];
  signOut: typeof authClient.signOut;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { data, isPending, error, refetch } = authClient.useSession();

  const value = useMemo<AuthContextValue>(
    () => ({
      session: data,
      user: data?.user ?? null,
      isLoading: isPending,
      error,
      refetch,
      signOut: authClient.signOut,
    }),
    [data, error, isPending, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
