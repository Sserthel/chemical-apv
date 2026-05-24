import type {
  Chemical,
  ChemicalApv,
  RiskLevel,
  StoredUpload,
} from "./types";
import {
  extractSdsData,
  ppeToEquipmentList,
  SDS_MISSING,
  type SdsFullData,
} from "./sds-extract";
import { getSystemSuggestions } from "./sds-suggestions";

function inferRisk(hStatements: string[]): RiskLevel {
  if (hStatements.length === 0) return "middel";

  const codes = hStatements.map((h) =>
    parseInt(h.replace(/\D/g, "").slice(0, 3), 10)
  );

  if (codes.some((n) => n >= 300 && n < 373)) return "høj";
  if (codes.some((n) => n === 314 || n === 315 || n === 318)) return "høj";
  if (codes.some((n) => (n >= 220 && n <= 230) || n === 240 || n === 241))
    return "middel";
  if (codes.some((n) => n >= 314 && n <= 317)) return "middel";

  return hStatements.length >= 3 ? "middel" : "lav";
}

function splitToItems(text: string, max = 6): string[] {
  if (!text || text === SDS_MISSING) return [];
  return text
    .split(/\n|•|·|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 400)
    .slice(0, max);
}

function buildRiskDescription(hStatements: string[], sds: SdsFullData): string {
  if (hStatements.length > 0) {
    const parts = [`H-sætninger fra SDS: ${hStatements.join(", ")}`];
    if (sds.signalWord !== SDS_MISSING) parts.push(`Signalord: ${sds.signalWord}`);
    return parts.join(". ") + ". Gennemgå SDS for fuld vurdering.";
  }
  if (sds.fireFighting.specialHazards !== SDS_MISSING) {
    return "Se brandfare i SDS sektion 5.";
  }
  return "Mangler oplysninger – udfyld manuelt efter gennemgang af SDS.";
}

function buildApv(chemical: Chemical, sds: SdsFullData): ChemicalApv {
  const sections: ChemicalApv["sections"] = [];

  const faItems = [
    sds.firstAid.inhalation !== SDS_MISSING &&
      `Indånding (SDS §4): ${sds.firstAid.inhalation.slice(0, 200)}`,
    sds.firstAid.skin !== SDS_MISSING &&
      `Hud (SDS §4): ${sds.firstAid.skin.slice(0, 200)}`,
    sds.firstAid.eyes !== SDS_MISSING &&
      `Øjne (SDS §4): ${sds.firstAid.eyes.slice(0, 200)}`,
  ].filter(Boolean) as string[];

  if (faItems.length > 0) {
    sections.push({ title: "Førstehjælp (SDS sektion 4)", items: faItems });
  }

  if (sds.fireFighting.specialHazards !== SDS_MISSING) {
    sections.push({
      title: "Brandfare (SDS sektion 5)",
      items: splitToItems(
        `${sds.fireFighting.suitableExtinguishingMedia}. ${sds.fireFighting.specialHazards}`
      ),
    });
  }

  if (sds.spillResponse !== SDS_MISSING) {
    sections.push({
      title: "Spildhåndtering (SDS sektion 6)",
      items: splitToItems(sds.spillResponse),
    });
  }

  if (sds.storage !== SDS_MISSING) {
    sections.push({
      title: "Opbevaring (SDS sektion 7)",
      items: splitToItems(sds.storage),
    });
  }

  if (sds.handling !== SDS_MISSING) {
    sections.push({
      title: "Håndtering (SDS sektion 7)",
      items: splitToItems(sds.handling),
    });
  }

  const measures = [
    ...sds.pStatements.map((p) => `Følg ${p} (SDS)`),
    ...chemical.protectiveEquipment.map((v) => `Værnemiddel: ${v}`),
  ];

  if (measures.length === 0) {
    measures.push("Gennemgå SDS og udfyld forholdsregler manuelt");
  }

  return {
    chemicalId: chemical.id,
    workplace: "Udfyld arbejdsplads/lokation",
    assessedBy: "Automatisk fra SDS-upload",
    assessedDate: new Date().toISOString().slice(0, 10),
    summary: `APV-kladde fra ${chemical.uploadedFileName ?? "SDS"}. Baseret på udtræk af SDS sektion 1–15. Gennemgå og godkend.`,
    sections,
    measures,
  };
}

export function createUploadFromSdsData(
  fileName: string,
  fullText: string,
  sds: SdsFullData,
  options?: {
    sourceUrl?: string;
    onlineSearch?: boolean;
  }
): StoredUpload {
  const id = `upload-${Date.now()}`;
  const productName =
    sds.productName !== SDS_MISSING
      ? sds.productName
      : fileName.replace(/\.pdf$/i, "").trim();

  const protectiveEquipment = ppeToEquipmentList(sds.ppe);
  const hStatements = sds.hStatements;
  const risk = inferRisk(hStatements);
  const casNumber = sds.casNumbers[0];

  const chemical: Chemical = {
    id,
    productName,
    casNumber,
    location: options?.onlineSearch
      ? "Online SDS – angiv lokation"
      : "Uploadet – angiv lokation",
    hStatements,
    pStatements: sds.pStatements,
    protectiveEquipment,
    risk,
    riskDescription: buildRiskDescription(hStatements, sds),
    sdsUrl: `/kemikalie/${id}/sds`,
    source: "upload",
    sdsFullText: fullText,
    sdsExtracted: sds,
    systemSuggestions: getSystemSuggestions(sds),
    uploadedFileName: fileName,
    uploadedAt: new Date().toISOString(),
    onlineSdsUrl: options?.sourceUrl,
    onlineSdsSource: options?.onlineSearch ? "online-search" : "upload",
  };

  const apv = buildApv(chemical, sds);
  return { chemical, apv };
}

export function createUploadFromSds(
  fileName: string,
  fullText: string
): StoredUpload {
  const sds = extractSdsData(fullText);
  return createUploadFromSdsData(fileName, fullText, sds);
}
