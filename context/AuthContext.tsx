"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getAuthEmail } from "@/lib/auth/email";
import {
  isAdminUser,
  resolveUserRole,
  roleLabel,
  type UserProfile,
  type UserRole,
} from "@/lib/auth/roles";
import { ensureProfile } from "@/lib/profile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  roleDisplay: string;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_TIMEOUT_MS = 5000;

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          console.warn(`[auth] Timeout: ${label}`);
          resolve(null);
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(configured);

  const loadProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser || !configured) {
      setProfile(null);
      return;
    }
    try {
      const client = createClient();
      const nextProfile = await withTimeout(
        ensureProfile(client, nextUser),
        SESSION_TIMEOUT_MS,
        "profile load"
      );
      if (nextProfile) setProfile(nextProfile);
    } catch (err) {
      console.warn("[auth] Profile load failed:", err);
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const client = createClient();
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, SESSION_TIMEOUT_MS);

    async function init() {
      try {
        const sessionResult = await withTimeout(
          client.auth.getSession(),
          SESSION_TIMEOUT_MS,
          "getSession"
        );

        let sessionUser = sessionResult?.data.session?.user ?? null;

        if (!sessionUser) {
          const userResult = await withTimeout(
            client.auth.getUser(),
            SESSION_TIMEOUT_MS,
            "getUser"
          );
          sessionUser = userResult?.data.user ?? null;
        }

        if (!mounted) return;
        setUser(sessionUser);
        void loadProfile(sessionUser);
      } catch (err) {
        console.warn("[auth] Session check failed:", err);
      } finally {
        clearTimeout(safetyTimer);
        if (mounted) setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setLoading(false);
        void loadProfile(nextUser);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!configured) return;
    const client = createClient();
    const result = await withTimeout(
      client.auth.getUser(),
      SESSION_TIMEOUT_MS,
      "refresh getUser"
    );
    const currentUser = result?.data.user ?? null;
    setUser(currentUser);
    await loadProfile(currentUser);
  }, [configured, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        return { error: "Supabase er ikke konfigureret. Tilføj miljøvariabler." };
      }
      const client = createClient();
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error: error.message };
      }
      await client.auth.getSession();
      return { error: null };
    },
    [configured]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      if (!configured) {
        return { error: "Supabase er ikke konfigureret. Tilføj miljøvariabler." };
      }
      const client = createClient();
      const { error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: fullName ? { full_name: fullName } : undefined,
        },
      });
      return { error: error?.message ?? null };
    },
    [configured]
  );

  const signOut = useCallback(async () => {
    if (configured) {
      const client = createClient();
      await client.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  }, [configured]);

  const authEmail = getAuthEmail(user, profile);
  const role = resolveUserRole(authEmail, profile?.role);
  const admin = isAdminUser(authEmail, profile?.role);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      loading,
      configured,
      isAdmin: admin,
      isEmployee: Boolean(user) && !admin,
      roleDisplay: role ? roleLabel(role) : "",
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [
      user,
      profile,
      role,
      loading,
      configured,
      admin,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
