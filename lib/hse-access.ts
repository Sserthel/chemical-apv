"use client";

import { useAuth } from "@/context/AuthContext";

/** Erstattet af Supabase Auth – beholdt for bagudkompatibilitet */
export function enableHseAccess(): void {
  // ingen effekt
}

export function useHseAccess(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin;
}

export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin;
}
