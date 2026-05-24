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
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { roleLabel, type UserProfile, type UserRole } from "@/lib/auth/roles";
import { ensureProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";

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

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(configured);

  const loadProfile = useCallback(
    async (client: SupabaseClient, nextUser: User | null) => {
      if (!nextUser) {
        setProfile(null);
        return;
      }
      const nextProfile = await ensureProfile(client, nextUser);
      setProfile(nextProfile);
    },
    []
  );

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const client = createClient();
    setSupabase(client);
    let mounted = true;

    async function init() {
      const {
        data: { user: sessionUser },
      } = await client.auth.getUser();

      if (!mounted) return;
      setUser(sessionUser);
      await loadProfile(client, sessionUser);
      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      await loadProfile(client, nextUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    setUser(currentUser);
    await loadProfile(supabase, currentUser);
  }, [loadProfile, supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        return { error: "Supabase er ikke konfigureret. Tilføj miljøvariabler." };
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      if (!supabase) {
        return { error: "Supabase er ikke konfigureret. Tilføj miljøvariabler." };
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: fullName ? { full_name: fullName } : undefined,
        },
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const role = profile?.role ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      loading,
      configured,
      isAdmin: role === "admin",
      isEmployee: role === "employee",
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
