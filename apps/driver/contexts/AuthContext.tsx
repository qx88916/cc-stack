import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
const TOKEN_KEY = "@auth/token";
const USER_KEY = "@auth/user";
const API_BASE_URL_KEY = "@auth/api_base_url";

const RENDER_API = "https://reidehail-backend.onrender.com";

/** Treat saved URL as outdated if it's a local/dev URL so we always use Render by default. */
function isLocalOrLegacyUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return (
    u.includes(":5000") ||
    u.includes("localhost") ||
    u.includes("127.0.0.1") ||
    u.includes("10.0.2.2") ||
    u.startsWith("http://192.168.") ||
    u.startsWith("http://10.")
  );
}

export type UserRole = "passenger" | "driver" | "admin";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role: UserRole;
  createdAt?: string;
}

interface AuthSession {
  user: AuthUser;
  token: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string; user?: AuthUser }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function normalizeUser(raw: { id: string; email?: string; name?: string; role?: string; createdAt?: string }): AuthUser {
  const role = (raw.role === "driver" || raw.role === "admin" ? raw.role : "passenger") as UserRole;
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    role,
    createdAt: raw.createdAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiBaseUrl, setApiBaseUrlState] = useState(RENDER_API);
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem(API_BASE_URL_KEY).then((saved) => {
      const trimmed = saved?.trim()?.replace(/\/$/, "") ?? "";
      if (trimmed && !isLocalOrLegacyUrl(trimmed)) {
        setApiBaseUrlState(trimmed);
      } else {
        setApiBaseUrlState(RENDER_API);
        if (trimmed && isLocalOrLegacyUrl(trimmed)) {
          AsyncStorage.setItem(API_BASE_URL_KEY, RENDER_API);
        }
      }
    });
  }, []);

  const setApiBaseUrl = useCallback(async (url: string) => {
    const trimmed = url.trim().replace(/\/$/, "");
    if (!trimmed) return;
    await AsyncStorage.setItem(API_BASE_URL_KEY, trimmed);
    setApiBaseUrlState(trimmed);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setSession(null);
        return;
      }
      const res = await fetch(`${apiBaseUrl}/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        setSession(null);
        return;
      }
      const data = await res.json();
      const user = normalizeUser(data.user);
      setSession({ user, token: data.token || token });
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    (async () => {
      try {
        const [token, userJson] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
        if (token[1] && userJson[1]) {
          const user = JSON.parse(userJson[1]) as AuthUser;
          setSession({ user, token: token[1] });
        }
        await refreshSession();
      } catch {
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch(`${apiBaseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: data.message || "Login failed" };
        }
        const user = normalizeUser(data.user);
        const token = data.token;
        await AsyncStorage.multiSet([
          [TOKEN_KEY, token],
          [USER_KEY, JSON.stringify(user)],
        ]);
        setSession({ user, token });
        return { user };
      } catch (e) {
        return { error: `Cannot reach backend at ${apiBaseUrl}. Check your connection or change Backend URL on Login.` };
      }
    },
    [apiBaseUrl]
  );

  const signup = useCallback(
    async (email: string, password: string, name: string, role: UserRole) => {
      try {
        const res = await fetch(`${apiBaseUrl}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            name: name.trim(),
            role,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: data.message || "Sign up failed" };
        }
        const user = normalizeUser(data.user);
        const token = data.token;
        await AsyncStorage.multiSet([
          [TOKEN_KEY, token],
          [USER_KEY, JSON.stringify(user)],
        ]);
        setSession({ user, token });
        return { user };
      } catch (e) {
        return { error: `Cannot reach backend at ${apiBaseUrl}. Check your connection or change Backend URL on Login.` };
      }
    },
    [apiBaseUrl]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setSession(null);
    router.replace("/(auth)/welcome");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ session, isLoading, apiBaseUrl, setApiBaseUrl, login, signup, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}
