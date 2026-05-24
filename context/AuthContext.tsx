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

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }
    if (!configured) return;
    const client = createClient();
    const nextProfile = await ensureProfile(client, nextUser);
    setProfile(nextProfile);
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const client = createClient();
    let mounted = true;

    async function init() {
      try {
        const {
          data: { user: sessionUser },
        } = await client.auth.getUser();

        if (!mounted) return;
        setUser(sessionUser);
        await loadProfile(sessionUser);
      } catch (err) {
        console.warn("[auth] Session check failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      await loadProfile(nextUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!configured) return;
    const client = createClient();
    const {
      data: { user: currentUser },
    } = await client.auth.getUser();
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

  const role = resolveUserRole(user?.email, profile?.role);
  const admin = isAdminUser(user?.email, profile?.role);

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
