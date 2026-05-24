import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  isSupabaseConfigured,
  normalizeSupabaseUrl,
} from "@/lib/supabase/config";

let client: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
      getSupabaseAnonKey()
    );
  }
  return client;
}

export { isSupabaseConfigured };
