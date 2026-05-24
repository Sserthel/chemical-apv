import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/auth/roles";

/** Hent e-mail fra session, profil eller metadata */
export function getAuthEmail(
  user: User | null | undefined,
  profile?: UserProfile | null
): string | null {
  const sources = [
    user?.email,
    profile?.email,
    user?.user_metadata?.email as string | undefined,
  ];

  for (const raw of sources) {
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.includes("@")) return trimmed;
    }
  }
  return null;
}
