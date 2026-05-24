import { chemicals as mockChemicals, apvRecords as mockApv } from "./mock-data";
import type { Chemical, ChemicalApv, StoredUpload } from "./types";

export { mockChemicals, mockApv };

export function mergeChemicals(uploads: StoredUpload[]): Chemical[] {
  const uploaded = uploads.map((u) => u.chemical);
  return [...uploaded, ...mockChemicals];
}

export function getApvForId(
  id: string,
  uploads: StoredUpload[]
): ChemicalApv | undefined {
  const fromUpload = uploads.find((u) => u.chemical.id === id)?.apv;
  if (fromUpload) return fromUpload;
  return mockApv.find((a) => a.chemicalId === id);
}

export function searchAll(query: string, uploads: StoredUpload[]): Chemical[] {
  const all = mergeChemicals(uploads);
  const q = query.trim().toLowerCase();
  if (!q) return all;

  return all.filter((c) => {
    const pList = c.pStatements ?? [];
    const extracted = c.sdsExtracted;
    const sdsText = extracted
      ? JSON.stringify(extracted).toLowerCase()
      : "";
    return (
      c.productName.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.hStatements.some((h) => h.toLowerCase().includes(q)) ||
      pList.some((p) => p.toLowerCase().includes(q)) ||
      (c.casNumber?.toLowerCase().includes(q) ?? false) ||
      (c.uploadedFileName?.toLowerCase().includes(q) ?? false) ||
      sdsText.includes(q)
    );
  });
}
