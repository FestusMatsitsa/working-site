import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  phone?: string | null;
};

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: AuthUser };

type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const user: AuthUser = await r.json();
          setState({ status: "authenticated", user });
        } else {
          setState({ status: "unauthenticated" });
        }
      })
      .catch(() => setState({ status: "unauthenticated" }));
  }, []);

  async function login(email: string, password: string): Promise<{ error?: string }> {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) {
      const user: AuthUser = await r.json();
      setState({ status: "authenticated", user });
      return {};
    }
    const body = await r.json().catch(() => ({}));
    return { error: body.error ?? "Login failed" };
  }

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setState({ status: "unauthenticated" });
  }

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useCurrentUser(): AuthUser | null {
  const { state } = useAuth();
  return state.status === "authenticated" ? state.user : null;
}

/** Returns true if current user has at least the given role */
export function hasRole(userRole: string, required: "admin" | "technician" | "user"): boolean {
  // ict_officer is treated as technician
  const rank: Record<string, number> = { admin: 3, technician: 2, ict_officer: 2, user: 1 };
  return (rank[userRole] ?? 0) >= (rank[required] ?? 0);
}
