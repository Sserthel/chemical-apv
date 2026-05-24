import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredUpload } from "@/lib/types";

export async function fetchChemicalUploadsFromSupabase(
  client: SupabaseClient
): Promise<StoredUpload[]> {
  const { data, error } = await client
    .from("chemical_uploads")
    .select("id, data, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("[supabase] Kunne ikke hente kemikalie-uploads:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => {
      if (!row.data || typeof row.data !== "object") return null;
      const upload = row.data as StoredUpload;
      if (!upload.chemical?.id) return null;
      return upload;
    })
    .filter(Boolean) as StoredUpload[];
}

export async function upsertChemicalUploadToSupabase(
  client: SupabaseClient,
  upload: StoredUpload,
  userId?: string
): Promise<void> {
  const { error } = await client.from("chemical_uploads").upsert(
    {
      id: upload.chemical.id,
      data: upload,
      updated_at: new Date().toISOString(),
      ...(userId ? { created_by: userId } : {}),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.warn("[supabase] Kunne ikke gemme kemikalie-upload:", error.message);
    throw error;
  }
}

export async function deleteChemicalUploadFromSupabase(
  client: SupabaseClient,
  chemicalId: string
): Promise<void> {
  const { error } = await client
    .from("chemical_uploads")
    .delete()
    .eq("id", chemicalId);

  if (error) {
    console.warn("[supabase] Kunne ikke slette kemikalie-upload:", error.message);
  }
}

export function mergeChemicalUploads(
  local: StoredUpload[],
  remote: StoredUpload[]
): StoredUpload[] {
  const map = new Map<string, StoredUpload>();
  for (const item of local) {
    map.set(item.chemical.id, item);
  }
  for (const item of remote) {
    if (!map.has(item.chemical.id)) {
      map.set(item.chemical.id, item);
    }
  }
  return Array.from(map.values());
}
