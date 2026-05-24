import type { ChemicalRiskAssessment } from "./risk-assessment-types";
import type { Chemical } from "./types";
import { SDS_MISSING } from "./sds-extract";
import {
  buildSafetyContext,
  type GhsSymbolItem,
  type PpeSymbolItem,
} from "./safety-symbols";
import type { RiskBadgeVariant } from "./risk-visual";

export interface EmployeeSafetyBrief {
  productName: string;
  workplace: string;
  riskLevel: RiskBadgeVariant;
  ghs: GhsSymbolItem[];
  ppe: PpeSymbolItem[];
  ppeLabels: string[];
  topHazards: string[];
  mustDo: string[];
  mustNot: string[];
  attentions: string[];
  accidentFirstAid: string[];
  accidentSpill: string;
  stopRules: string[];
  contactPerson: string;
  emergencyPhone: string;
  sdsHref: string;
  sdsIsExternal: boolean;
}

const MISSING = "Mangler oplysninger";

function clean(text: string | undefined): string {
  if (!text?.trim() || text.trim() === SDS_MISSING) return "";
  return text
    .replace(/\[SDS[^\]]*\]\s*/gi, "")
    .replace(/\[Arbejdsopgave\]\s*/gi, "")
    .replace(/\[Forslag[^\]]*\]\s*/gi, "")
    .trim();
}

function short(text: string, max = 100): string {
  const t = clean(text);
  if (!t) return "";
  const sentence = t.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() ?? t;
  return sentence.length > max ? `${sentence.slice(0, max - 1)}…` : sentence;
}

function sectionLines(assessment: ChemicalRiskAssessment, key: string): string[] {
  const content = assessment.sections.find((s) => s.key === key)?.content ?? "";
  return content
    .split("\n")
    .map(clean)
    .filter(Boolean);
}

function unique(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const t = short(item, 90);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

const H_ATTENTION: [RegExp, string][] = [
  [/H314|H318/, "Undgå stænk og kontakt med øjne"],
  [/H315|H317/, "Undgå hudkontakt"],
  [/H225|H226|H220/, "Hold væk fra varme, gnister og åben ild"],
  [/H332|H335|H336/, "Undgå indånding af dampe/aerosoler"],
  [/H290/, "Undgå kontakt med metaloverflader"],
  [/H400|H410/, "Undgå udledning til miljø"],
];

function topHazards(chemical: Chemical, assessment: ChemicalRiskAssessment): string[] {
  const sds = assessment.sdsData;
  const lines: string[] = [];

  if (sds.signalWord && sds.signalWord !== SDS_MISSING) {
    lines.push(`${sds.signalWord} – ${short(chemical.riskDescription, 70) || "fare"}`);
  }

  for (const h of chemical.hStatements.slice(0, 3)) {
    lines.push(h);
  }

  if (lines.length < 3 && chemical.riskDescription) {
    lines.push(short(chemical.riskDescription, 80));
  }

  return unique(lines, 3);
}

function attentions(chemical: Chemical, assessment: ChemicalRiskAssessment): string[] {
  const lines: string[] = [];
  for (const h of chemical.hStatements) {
    for (const [re, msg] of H_ATTENTION) {
      if (re.test(h) && !lines.includes(msg)) lines.push(msg);
    }
  }

  const farlige = sectionLines(assessment, "farlige_egenskaber");
  lines.push(...farlige.map((l) => short(l, 80)));

  if (assessment.workTaskData.sprayAerosol === "ja") {
    lines.push("Sørg for ventilation ved spray/aerosol");
  }

  return unique(lines, 4);
}

function mustDoList(
  assessment: ChemicalRiskAssessment,
  ppeLabels: string[]
): string[] {
  const lines: string[] = [...ppeLabels];

  lines.push(...sectionLines(assessment, "foranstaltninger").slice(0, 3));
  lines.push(...sectionLines(assessment, "vaernemidler").slice(0, 2));

  const work = assessment.workTaskData;
  if (work.vaernemidler?.trim()) {
    lines.push(...work.vaernemidler.split(/[,;]/).map((s) => s.trim()));
  }
  if (work.ventilation?.trim()) {
    lines.push(`Ventilation: ${short(work.ventilation, 60)}`);
  }

  const med = sectionLines(assessment, "medarbejderinstruktion");
  if (med[1]) lines.push(med[1]);

  return unique(lines, 5);
}

function mustNotList(chemical: Chemical, assessment: ChemicalRiskAssessment): string[] {
  const pList = chemical.pStatements?.length
    ? chemical.pStatements
    : assessment.sdsData.pStatements;

  const lines: string[] = [];
  for (const p of pList.slice(0, 4)) {
    if (/^P2[0-9]{2}/i.test(p)) {
      lines.push(`Følg ${p}`);
    }
  }

  lines.push("Spis, drik og ryg ikke ved arbejdet");
  lines.push("Bland ikke med andre produkter uden instruktion");

  if (assessment.workTaskData.opvarmning === "ja") {
    lines.push("Opvarm ikke uden godkendt procedure");
  }

  return unique(lines, 4);
}

function stopRulesList(chemical: Chemical, assessment: ChemicalRiskAssessment): string[] {
  const rules = [
    "Der mangler værnemidler",
    "Du er i tvivl om sikker brug",
  ];

  const hasH314 = chemical.hStatements.some((h) => /H314/i.test(h));
  if (hasH314) {
    rules.unshift("Der ikke er adgang til øjenskyl ved ætsende produkt");
  }

  for (const gap of assessment.riskCalculation?.criticalGaps ?? []) {
    if (gap.priority === "P1") {
      rules.push(short(gap.message, 80));
    }
  }

  return unique(rules, 5);
}

function firstAidList(assessment: ChemicalRiskAssessment): string[] {
  const fa = assessment.sdsData.firstAid;
  return unique(
    [
      fa.eyes !== SDS_MISSING ? `Øjne: ${short(fa.eyes, 85)}` : "",
      fa.skin !== SDS_MISSING ? `Hud: ${short(fa.skin, 85)}` : "",
      fa.inhalation !== SDS_MISSING ? `Indånding: ${short(fa.inhalation, 85)}` : "",
    ],
    3
  );
}

function spillText(assessment: ChemicalRiskAssessment): string {
  const spill = assessment.sdsData.spillResponse;
  if (spill && spill !== SDS_MISSING) return short(spill, 120);
  const work = assessment.workTaskData.affaldSpild;
  if (work?.trim()) return short(work, 120);
  return "Afspær området. Brug absorberingsmateriale. Kontakt ansvarlig.";
}

function ppeLabelsFromItems(ppe: PpeSymbolItem[], assessment: ChemicalRiskAssessment): string[] {
  const labels = ppe.map((p) => p.label.replace(/ påbudt$/i, ""));
  const sds = assessment.sdsData.ppe;
  if (sds.handProtection !== SDS_MISSING) {
    labels.push(short(sds.handProtection, 50));
  }
  if (sds.eyeProtection !== SDS_MISSING) {
    labels.push(short(sds.eyeProtection, 50));
  }
  return unique(labels, 5);
}

function sdsLink(chemical: Chemical): { href: string; external: boolean } {
  if (chemical.source === "upload") {
    return { href: `/kemikalie/${chemical.id}/sds`, external: false };
  }
  return { href: chemical.sdsUrl, external: true };
}

/** Kun data fra publiceret kemisk risikovurdering (APV). */
export function buildEmployeeSafetyBrief(
  chemical: Chemical,
  assessment: ChemicalRiskAssessment
): EmployeeSafetyBrief {
  if (assessment.status !== "publiceret") {
    throw new Error("APV er ikke publiceret");
  }

  const safety = buildSafetyContext(chemical, assessment);
  const ppeLabels = ppeLabelsFromItems(safety.ppeRequired, assessment);
  const sds = sdsLink(chemical);

  const contact =
    assessment.workTaskData.afdeling?.trim() ||
    sectionLines(assessment, "godkendelse")[0] ||
    "Kontakt nærmeste leder / arbejdsmiljøansvarlig";

  return {
    productName: assessment.productName,
    workplace:
      assessment.workTaskData.afdeling?.trim() ||
      chemical.location,
    riskLevel: safety.riskLevel,
    ghs: safety.ghs,
    ppe: safety.ppeRequired,
    ppeLabels,
    topHazards: topHazards(chemical, assessment),
    mustDo: mustDoList(assessment, ppeLabels),
    mustNot: mustNotList(chemical, assessment),
    attentions: attentions(chemical, assessment),
    accidentFirstAid: firstAidList(assessment),
    accidentSpill: spillText(assessment),
    stopRules: stopRulesList(chemical, assessment),
    contactPerson: contact,
    emergencyPhone: "112 ved livstruende · Giftlinjen 82 12 12 12",
    sdsHref: sds.href,
    sdsIsExternal: sds.external,
  };
}

export function isPublishedForEmployees(
  assessment: ChemicalRiskAssessment | null | undefined
): assessment is ChemicalRiskAssessment {
  return assessment?.status === "publiceret";
}
