/** Normaliser Supabase URL – fjern fejlagtigt /rest/v1/ suffix */
export function normalizeSupabaseUrl(url: string | undefined): string {
  if (!url) return "";
  return url.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) && getSupabaseAnonKey());
}
