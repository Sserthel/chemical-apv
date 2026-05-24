import type { ChemicalApv } from "./types";
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
  location: string;
  workplace: string;
  riskLevel: RiskBadgeVariant;
  ghs: GhsSymbolItem[];
  ppe: PpeSymbolItem[];
  keyHazards: string[];
  keyRules: string[];
  instruction: string;
  firstAid: string[];
  spill: string;
  emergencyContact: string;
  contactPerson: string;
  hasPublishedAssessment: boolean;
}

const MISSING = "Mangler oplysninger";

function clean(text: string | undefined): string {
  if (!text?.trim() || text.trim() === SDS_MISSING) return "";
  return text.replace(/\[SDS[^\]]*\]\s*/gi, "").replace(/\[Arbejdsopgave\]\s*/gi, "").trim();
}

function short(text: string, max = 120): string {
  const t = clean(text);
  if (!t) return "";
  const sentence = t.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() ?? t;
  return sentence.length > max ? `${sentence.slice(0, max - 1)}…` : sentence;
}

function sectionContent(
  assessment: ChemicalRiskAssessment | undefined,
  key: string
): string {
  return assessment?.sections.find((s) => s.key === key)?.content ?? "";
}

function uniqueNonEmpty(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const t = short(raw, 100);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= limit) break;
  }
  return out;
}

function hazardLines(chemical: Chemical, assessment?: ChemicalRiskAssessment): string[] {
  const sds = chemical.sdsExtracted ?? assessment?.sdsData;
  const lines: string[] = [];

  if (sds?.signalWord && sds.signalWord !== SDS_MISSING) {
    lines.push(`Signalord: ${sds.signalWord}`);
  }

  for (const h of chemical.hStatements.slice(0, 4)) {
    lines.push(h);
  }

  if (lines.length < 3 && chemical.riskDescription) {
    lines.push(short(chemical.riskDescription, 90));
  }

  if (assessment?.riskCalculation?.criticalWarnings.length) {
    lines.push(short(assessment.riskCalculation.criticalWarnings[0], 90));
  }

  return uniqueNonEmpty(lines, 4);
}

function ruleLines(
  chemical: Chemical,
  apv: ChemicalApv | undefined,
  assessment?: ChemicalRiskAssessment
): string[] {
  const lines: string[] = [];

  for (const p of (chemical.pStatements ?? assessment?.sdsData.pStatements ?? []).slice(0, 3)) {
    lines.push(p);
  }

  if (apv?.measures) {
    lines.push(...apv.measures.slice(0, 3));
  }

  const foranst = sectionContent(assessment, "foranstaltninger");
  if (foranst) {
    lines.push(
      ...foranst
        .split("\n")
        .map((l) => clean(l))
        .filter(Boolean)
        .slice(0, 2)
    );
  }

  return uniqueNonEmpty(lines, 4);
}

function instructionLine(
  chemical: Chemical,
  apv: ChemicalApv | undefined,
  assessment?: ChemicalRiskAssessment
): string {
  const med = sectionContent(assessment, "medarbejderinstruktion");
  if (med) {
    const lines = med.split("\n").map(clean).filter(Boolean);
    if (lines.length >= 2) return `${lines[1]} ${lines[2] ?? ""}`.trim();
    if (lines.length === 1) return lines[0];
  }

  const work = assessment?.workTaskData.eksisterendeInstruktion;
  if (work?.trim()) return short(work, 160);

  if (apv?.summary) return short(apv.summary, 160);

  if (apv?.measures[0]) return apv.measures[0];

  return "Følg SDS og lokale procedurer. Brug angivne værnemidler.";
}

function firstAidLines(
  chemical: Chemical,
  assessment?: ChemicalRiskAssessment
): string[] {
  const fa = chemical.sdsExtracted?.firstAid ?? assessment?.sdsData.firstAid;
  if (!fa) return [MISSING];

  return uniqueNonEmpty(
    [
      fa.eyes !== SDS_MISSING ? `Øjne: ${short(fa.eyes, 80)}` : "",
      fa.skin !== SDS_MISSING ? `Hud: ${short(fa.skin, 80)}` : "",
      fa.inhalation !== SDS_MISSING ? `Indånding: ${short(fa.inhalation, 80)}` : "",
    ],
    3
  );
}

function spillLine(
  chemical: Chemical,
  apv: ChemicalApv | undefined,
  assessment?: ChemicalRiskAssessment
): string {
  const spill =
    chemical.sdsExtracted?.spillResponse ??
    assessment?.sdsData.spillResponse ??
    assessment?.workTaskData.affaldSpild;

  if (spill && spill !== SDS_MISSING) return short(spill, 140);

  const spillFromApv = apv?.sections
    .flatMap((s) => s.items)
    .find((i) => /spild/i.test(i));
  if (spillFromApv) return spillFromApv;

  return "Inddæm spild. Brug passende absorberingsmateriale. Spild i godkendt affald.";
}

function emergencyBlock(
  chemical: Chemical,
  apv: ChemicalApv | undefined,
  assessment?: ChemicalRiskAssessment
): { emergency: string; contact: string } {
  const supplier = chemical.sdsExtracted?.supplier ?? assessment?.sdsData.supplier;
  const emergency =
    supplier && supplier !== SDS_MISSING
      ? `112 ved livstruende · Giftlinjen 82 12 12 12`
      : "112 ved livstruende · Giftlinjen 82 12 12 12";

  const contact =
    apv?.assessedBy?.trim() ||
    assessment?.workTaskData.afdeling?.trim() ||
    "Kontakt nærmeste leder / arbejdsmiljøansvarlig";

  return { emergency, contact };
}

export function buildEmployeeSafetyBrief(
  chemical: Chemical,
  assessment?: ChemicalRiskAssessment | null,
  apv?: ChemicalApv | null
): EmployeeSafetyBrief {
  const safety = buildSafetyContext(chemical, assessment ?? undefined);
  const { emergency, contact } = emergencyBlock(
    chemical,
    apv ?? undefined,
    assessment ?? undefined
  );

  return {
    productName: chemical.productName,
    location: chemical.location,
    workplace: apv?.workplace ?? assessment?.workTaskData.afdeling ?? chemical.location,
    riskLevel: safety.riskLevel,
    ghs: safety.ghs,
    ppe: safety.ppeRequired,
    keyHazards: hazardLines(chemical, assessment ?? undefined),
    keyRules: ruleLines(chemical, apv ?? undefined, assessment ?? undefined),
    instruction: instructionLine(chemical, apv ?? undefined, assessment ?? undefined),
    firstAid: firstAidLines(chemical, assessment ?? undefined),
    spill: spillLine(chemical, apv ?? undefined, assessment ?? undefined),
    emergencyContact: emergency,
    contactPerson: contact,
    hasPublishedAssessment: !!assessment,
  };
}
