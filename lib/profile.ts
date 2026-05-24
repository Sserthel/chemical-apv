import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAuthEmail } from "@/lib/auth/email";
import {
  resolveRoleForEmail,
  type UserProfile,
  type UserRole,
} from "@/lib/auth/roles";

function normalizeRole(value: unknown): UserRole {
  const role = String(value ?? "").trim().toLowerCase();
  return role === "admin" ? "admin" : "employee";
}

function profileFromUser(user: User, role: UserRole): UserProfile {
  return {
    id: user.id,
    email: getAuthEmail(user) ?? null,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
    role,
    created_at: new Date().toISOString(),
  };
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[profiles] Kunne ikke hente profil:", error.message);
    return null;
  }
  if (!data) return null;
  return {
    ...data,
    role: normalizeRole(data.role),
  };
}

export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<UserProfile | null> {
  const existing = await fetchProfile(supabase, user.id);
  const email = getAuthEmail(user, existing);
  const expectedRole = resolveRoleForEmail(email);

  if (existing) {
    if (existing.role !== expectedRole) {
      const { data: updated, error } = await supabase
        .from("profiles")
        .update({
          role: expectedRole,
          ...(email ? { email } : {}),
        })
        .eq("id", user.id)
        .select("id, email, full_name, role, created_at")
        .maybeSingle();
      if (error) {
        console.warn("[profiles] Kunne ikke opdatere rolle:", error.message);
        return profileFromUser(user, expectedRole);
      }
      if (updated) {
        return { ...updated, role: normalizeRole(updated.role) };
      }
    }
    return existing.role === expectedRole
      ? existing
      : { ...existing, role: expectedRole };
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: email ?? null,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      role: expectedRole,
    })
    .select("id, email, full_name, role, created_at")
    .single();

  if (error) {
    console.warn("[profiles] Kunne ikke oprette profil:", error.message);
    const retry = await fetchProfile(supabase, user.id);
    if (retry) return retry;
    return profileFromUser(user, expectedRole);
  }

  return { ...data, role: normalizeRole(data.role) };
}
