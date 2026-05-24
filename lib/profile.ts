import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  resolveRoleForEmail,
  type UserProfile,
  type UserRole,
} from "@/lib/auth/roles";

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    ...data,
    role: data.role as UserRole,
  };
}

export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<UserProfile | null> {
  const existing = await fetchProfile(supabase, user.id);
  if (existing) {
    const expectedRole = resolveRoleForEmail(user.email);
    if (existing.role !== expectedRole && user.email) {
      const { data: updated } = await supabase
        .from("profiles")
        .update({ role: expectedRole, email: user.email })
        .eq("id", user.id)
        .select("id, email, full_name, role, created_at")
        .maybeSingle();
      if (updated) {
        return { ...updated, role: updated.role as UserRole };
      }
    }
    return existing;
  }

  const role = resolveRoleForEmail(user.email);
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      role,
    })
    .select("id, email, full_name, role, created_at")
    .single();

  if (error) {
    const retry = await fetchProfile(supabase, user.id);
    return retry;
  }

  return { ...data, role: data.role as UserRole };
}
