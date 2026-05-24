import type { ChemicalRiskAssessment } from "./risk-assessment-types";

const STORAGE_KEY = "kemisk-apv-risk-assessments";

export function loadRiskAssessments(): ChemicalRiskAssessment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChemicalRiskAssessment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRiskAssessments(items: ChemicalRiskAssessment[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertRiskAssessment(item: ChemicalRiskAssessment): void {
  const all = loadRiskAssessments();
  const idx = all.findIndex((a) => a.id === item.id);
  if (idx >= 0) all[idx] = item;
  else all.unshift(item);
  saveRiskAssessments(all);
}

export function deleteRiskAssessment(id: string): void {
  saveRiskAssessments(loadRiskAssessments().filter((a) => a.id !== id));
}

export function getPublishedForChemical(
  chemicalId: string
): ChemicalRiskAssessment | undefined {
  return loadRiskAssessments().find(
    (a) => a.chemicalId === chemicalId && a.status === "publiceret"
  );
}
