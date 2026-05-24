import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChemicalRiskAssessment } from "@/lib/risk-assessment-types";

function rowToAssessment(row: {
  id: string;
  data: unknown;
}): ChemicalRiskAssessment | null {
  if (!row.data || typeof row.data !== "object") return null;
  const data = row.data as ChemicalRiskAssessment;
  if (!data.id || !data.chemicalId) return null;
  return data;
}

export async function fetchRiskAssessmentsFromSupabase(
  client: SupabaseClient,
  options?: { publishedOnly?: boolean }
): Promise<ChemicalRiskAssessment[]> {
  let query = client
    .from("risk_assessments")
    .select("id, data, updated_at")
    .order("updated_at", { ascending: false });

  if (options?.publishedOnly) {
    query = query.eq("status", "publiceret");
  }

  const { data, error } = await query;

  if (error) {
    console.warn("[supabase] Kunne ikke hente risikovurderinger:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => rowToAssessment(row as { id: string; data: unknown }))
    .filter(Boolean) as ChemicalRiskAssessment[];
}

export async function upsertRiskAssessmentToSupabase(
  client: SupabaseClient,
  assessment: ChemicalRiskAssessment,
  userId?: string
): Promise<void> {
  const { error } = await client.from("risk_assessments").upsert(
    {
      id: assessment.id,
      chemical_id: assessment.chemicalId,
      product_name: assessment.productName,
      status: assessment.status,
      data: assessment,
      updated_at: assessment.updatedAt,
      ...(userId ? { created_by: userId } : {}),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.warn("[supabase] Kunne ikke gemme risikovurdering:", error.message);
    throw error;
  }
}

export async function deleteRiskAssessmentFromSupabase(
  client: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await client.from("risk_assessments").delete().eq("id", id);
  if (error) {
    console.warn("[supabase] Kunne ikke slette risikovurdering:", error.message);
  }
}

export function mergeRiskAssessments(
  local: ChemicalRiskAssessment[],
  remote: ChemicalRiskAssessment[]
): ChemicalRiskAssessment[] {
  const map = new Map<string, ChemicalRiskAssessment>();

  for (const item of local) {
    map.set(item.id, item);
  }

  for (const remoteItem of remote) {
    const existing = map.get(remoteItem.id);
    if (!existing) {
      map.set(remoteItem.id, remoteItem);
      continue;
    }
    const existingTime = Date.parse(existing.updatedAt) || 0;
    const remoteTime = Date.parse(remoteItem.updatedAt) || 0;
    if (remoteTime >= existingTime) {
      map.set(remoteItem.id, remoteItem);
    }
  }

  const merged = Array.from(map.values());

  const publishedByChemical = new Map<string, ChemicalRiskAssessment>();
  for (const item of merged) {
    if (item.status !== "publiceret") continue;
    const prev = publishedByChemical.get(item.chemicalId);
    if (!prev || Date.parse(item.updatedAt) > Date.parse(prev.updatedAt)) {
      publishedByChemical.set(item.chemicalId, item);
    }
  }

  return merged.map((item) => {
    if (item.status !== "publiceret") return item;
    const winner = publishedByChemical.get(item.chemicalId);
    if (winner && winner.id !== item.id) {
      return { ...item, status: "klar" as const };
    }
    return item;
  });
}
