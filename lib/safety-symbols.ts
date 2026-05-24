import type { SdsFullData } from "./sds-extract";
import type { ChemicalRiskAssessment } from "./risk-assessment-types";
import type { Chemical } from "./types";
import type { MatrixRiskLevel } from "./exposure-risk-engine";
import { computeExposureRisk } from "./exposure-risk-engine";
import { sdsExtractedToAssessmentData } from "./risk-assessment-types";

export type SymbolSource =
  | "sds"
  | "h-derived"
  | "sds-section-8"
  | "worktask"
  | "suggestion"
  | "missing";

export interface GhsSymbolItem {
  code: string;
  file: string;
  label: string;
  source: SymbolSource;
  sourceDetail: string;
  hCodes?: string[];
}

export interface PpeSymbolItem {
  id: string;
  isoCode: string;
  file: string;
  label: string;
  source: SymbolSource;
  sourceDetail: string;
}

export const PPE_SYMBOL_BASE = "/symbols/ppe";

export function ppeSymbolPath(file: string): string {
  return `${PPE_SYMBOL_BASE}/${file}`;
}

export const ISO_PPE_META: Record<
  string,
  { label: string; file: string }
> = {
  M003: { label: "Høreværn påbudt", file: "iso-m003-ear-protection.svg" },
  M004: { label: "Øjenbeskyttelse påbudt", file: "iso-m004-eye-protection.svg" },
  M008: { label: "Sikkerhedsfodtøj påbudt", file: "iso-m008-safety-footwear.svg" },
  M009: { label: "Beskyttelseshandsker påbudt", file: "iso-m009-protective-gloves.svg" },
  M010: { label: "Beskyttelsesbeklædning påbudt", file: "iso-m010-protective-clothing.svg" },
  M013: { label: "Ansigtsskærm påbudt", file: "iso-m013-face-shield.svg" },
  M014: { label: "Hovedværn påbudt", file: "iso-m014-head-protection.svg" },
  M016: { label: "Maske påbudt", file: "iso-m016-mask.svg" },
  M017: { label: "Åndedrætsværn påbudt", file: "iso-m017-respiratory-protection.svg" },
};

export const GHS_SYMBOL_BASE = "/symbols/ghs";

/** Filtyper for manuelt hentede UNECE-filer (GIF) vs. repo-SVG'er */
const GHS_FILE_EXT: Partial<Record<string, "svg" | "gif">> = {
  ghs01: "gif",
};

export function ghsSymbolPath(file: string): string {
  const base = file.replace(/\.(svg|gif)$/i, "").toLowerCase();
  const ext = GHS_FILE_EXT[base] ?? "svg";
  return `${GHS_SYMBOL_BASE}/${base}.${ext}`;
}

export const GHS_LABELS: Record<string, string> = {
  GHS01: "Eksplosiv",
  GHS02: "Brandfarlig",
  GHS03: "Oxiderende",
  GHS04: "Gas under tryk",
  GHS05: "Ætsende",
  GHS06: "Akut toksisk",
  GHS07: "Irriterende / sundhedsfare",
  GHS08: "Alvorlig sundhedsskade",
  GHS09: "Miljøfare",
};

const H_TO_GHS: [RegExp, string][] = [
  [/^H2(2[0-8]|20|21)/, "GHS02"],
  [/^H270|^H271|^H272/, "GHS03"],
  [/^H280|^H281/, "GHS04"],
  [/^H290|^H314|^H318/, "GHS05"],
  [/^H300|^H301|^H310|^H311|^H330|^H331/, "GHS06"],
  [/^H302|^H312|^H315|^H317|^H319|^H332|^H335|^H336/, "GHS07"],
  [/^H304|^H334|^H340|^H341|^H350|^H351|^H360|^H361|^H370|^H371|^H372|^H373/, "GHS08"],
  [/^H400|^H410|^H411|^H412/, "GHS09"],
];

const ISO_PPE_RULES: {
  isoCode: keyof typeof ISO_PPE_META;
  pattern: RegExp;
}[] = [
  {
    isoCode: "M004",
    pattern:
      /sikkerhedsbrille|beskyttelsesbrille|øjenbeskyttelse|tætsluttende brille|goggle/i,
  },
  {
    isoCode: "M009",
    pattern:
      /handske|nitril|butyl|neopren|kemikalieresistente handsker|beskyttelseshandske|glove/i,
  },
  {
    isoCode: "M013",
    pattern: /ansigtsskærm|visir|face shield/i,
  },
  {
    isoCode: "M017",
    pattern:
      /åndedræt|filter|\ba2\b|\babek\b|\bp2\b|\bp3\b|\bffp|respirator|halvmaske|helmaske/i,
  },
  { isoCode: "M016", pattern: /\bmaske\b/i },
  {
    isoCode: "M010",
    pattern:
      /beskyttelsesdragt|kemikaliedragt|forklæde|beskyttelsesbeklædning|kropsbeskyttelse/i,
  },
  {
    isoCode: "M008",
    pattern: /sikkerhedssko|værnefodtøj|sikkerhedsfodtøj/i,
  },
  { isoCode: "M014", pattern: /hjelm|hovedværn|hovedbeskyttelse/i },
  { isoCode: "M003", pattern: /høreværn|øreprop|høreklokke/i },
];

function normalizeH(code: string): string {
  return code.toUpperCase().replace(/\s/g, "");
}

export function mapHToGhs(hStatements: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const raw of hStatements) {
    const h = normalizeH(raw);
    for (const [re, ghs] of H_TO_GHS) {
      if (re.test(h)) {
        const list = map.get(ghs) ?? [];
        if (!list.includes(h)) list.push(h);
        map.set(ghs, list);
      }
    }
  }
  return map;
}

export function resolveGhsSymbols(
  hStatements: string[],
  sdsPictograms?: string[]
): GhsSymbolItem[] {
  const items: GhsSymbolItem[] = [];
  const seen = new Set<string>();

  if (sdsPictograms?.length) {
    for (const p of sdsPictograms) {
      const m = p.match(/GHS\s*0?(\d{1,2})/i);
      if (m) {
        const code = `GHS${m[1].padStart(2, "0")}`;
        if (!seen.has(code)) {
          seen.add(code);
          items.push({
            code,
            file: `${code.toLowerCase()}.svg`,
            label: GHS_LABELS[code] ?? code,
            source: "sds",
            sourceDetail: "Fra SDS farepiktogrammer",
          });
        }
      }
    }
  }

  const fromH = mapHToGhs(hStatements);
  for (const [ghs, codes] of fromH) {
    if (seen.has(ghs)) {
      const existing = items.find((i) => i.code === ghs);
      if (existing && existing.source === "sds") {
        existing.hCodes = codes;
        existing.sourceDetail += ` · bekræftet af ${codes.join(", ")}`;
      }
      continue;
    }
    seen.add(ghs);
    items.push({
      code: ghs,
      file: `${ghs.toLowerCase()}.svg`,
      label: GHS_LABELS[ghs] ?? ghs,
      source: "h-derived",
      sourceDetail: `Udledt fra ${codes.join(", ")}`,
      hCodes: codes,
    });
  }

  return items.sort((a, b) => a.code.localeCompare(b.code));
}

function makePpeItem(
  isoCode: keyof typeof ISO_PPE_META,
  source: SymbolSource,
  sourceDetail: string
): PpeSymbolItem {
  const meta = ISO_PPE_META[isoCode];
  return {
    id: isoCode.toLowerCase(),
    isoCode,
    file: meta.file,
    label: meta.label,
    source,
    sourceDetail,
  };
}

function scanPpeText(
  text: string,
  defaultSource: SymbolSource,
  detail: string
): PpeSymbolItem[] {
  const found: PpeSymbolItem[] = [];
  const seen = new Set<string>();
  for (const rule of ISO_PPE_RULES) {
    if (rule.pattern.test(text) && !seen.has(rule.isoCode)) {
      if (rule.isoCode === "M016" && /åndedræt|halvmaske|helmaske|respirator/i.test(text)) {
        continue;
      }
      seen.add(rule.isoCode);
      found.push(makePpeItem(rule.isoCode, defaultSource, detail));
    }
  }
  return found;
}

export function resolvePpeSymbols(
  sds?: SdsFullData,
  protectiveEquipment?: string[],
  workTaskPpe?: string
): PpeSymbolItem[] {
  const merged = new Map<string, PpeSymbolItem>();

  if (sds) {
    const sdsText = [
      sds.ppe.handProtection,
      sds.ppe.eyeProtection,
      sds.ppe.respiratoryProtection,
      sds.ppe.skinProtection,
      sds.ppe.ventilation,
    ].join(" ");
    for (const item of scanPpeText(sdsText, "sds-section-8", "Fra SDS sektion 8")) {
      merged.set(item.isoCode, item);
    }
  }

  if (protectiveEquipment?.length) {
    const text = protectiveEquipment.join(" ");
    for (const item of scanPpeText(text, "sds-section-8", "Fra SDS sektion 8")) {
      merged.set(item.isoCode, item);
    }
  }

  if (workTaskPpe?.trim()) {
    for (const item of scanPpeText(workTaskPpe, "worktask", "Fra arbejdsopgave")) {
      merged.set(item.isoCode, item);
    }
  }

  return [...merged.values()];
}

export function suggestPpeFromGaps(
  hStatements: string[],
  criticalGaps: { priority: string; message: string }[]
): PpeSymbolItem[] {
  const items: PpeSymbolItem[] = [];
  const hasH314 = hStatements.some((h) => /^H314/i.test(normalizeH(h)));

  for (const gap of criticalGaps) {
    if (/åndedræt|inhalation|spray uden ventilation/i.test(gap.message)) {
      items.push(
        makePpeItem(
          "M017",
          "suggestion",
          `P1-forslag: ${gap.message}`
        )
      );
    }
    if (/ansigtsbeskyttelse|H314/i.test(gap.message) && hasH314) {
      items.push(
        makePpeItem("M013", "suggestion", "P1-forslag pga. H314")
      );
    }
    if (/øjenbeskyttelse|H318|H319/i.test(gap.message)) {
      items.push(
        makePpeItem(
          "M004",
          "suggestion",
          `P1-forslag: ${gap.message}`
        )
      );
    }
  }

  return items;
}

export function chemicalRiskLevel(
  chemical: Chemical,
  assessment?: ChemicalRiskAssessment | null
): MatrixRiskLevel | "mangler" {
  if (assessment?.riskCalculation) {
    return assessment.riskCalculation.overallResidual;
  }
  const map: Record<string, MatrixRiskLevel> = {
    lav: "lav",
    middel: "middel",
    høj: "høj",
  };
  return map[chemical.risk] ?? "mangler";
}

export function buildSafetyContext(
  chemical: Chemical,
  assessment?: ChemicalRiskAssessment | null
) {
  const sds = chemical.sdsExtracted;
  const h = chemical.hStatements;

  let riskCalc = assessment?.riskCalculation;
  if (!riskCalc && sds) {
    const sdsData = sdsExtractedToAssessmentData(
      chemical.productName,
      chemical.casNumber,
      h,
      chemical.pStatements ?? [],
      chemical.protectiveEquipment,
      sds,
      "Kemikaliekort"
    );
    riskCalc = computeExposureRisk(sdsData, assessment?.workTaskData ?? {
      arbejdsopgave: "",
      afdeling: "",
      udfoerer: "",
      maengdePrGang: "",
      varighedPrGang: "",
      hyppighed: "",
      procesType: "åben",
      sprayAerosol: "nej",
      opvarmning: "nej",
      stoefudvikling: "nej",
      ventilation: "",
      punktudsugning: "nej",
      vaernemidler: "",
      risikoHudkontakt: "",
      risikoIndaanding: "",
      risikoOejnkontakt: "",
      opbevaringArbejdssted: "",
      affaldSpild: "",
      eksisterendeInstruktion: "",
    });
  }

  const ghs = resolveGhsSymbols(h, sds?.hazardPictograms);
  const ppe = resolvePpeSymbols(
    sds,
    chemical.protectiveEquipment,
    assessment?.workTaskData.vaernemidler
  );
  const suggestedPpe = suggestPpeFromGaps(
    h,
    riskCalc?.criticalGaps ?? []
  );

  const allPpe = [...ppe];
  for (const s of suggestedPpe) {
    if (!allPpe.some((p) => p.isoCode === s.isoCode && p.source !== "suggestion")) {
      allPpe.push(s);
    }
  }

  return {
    ghs,
    ppe: allPpe,
    ppeRequired: ppe,
    ppeSuggested: suggestedPpe,
    riskLevel: chemicalRiskLevel(chemical, assessment),
    riskCalc,
    criticalGaps: riskCalc?.criticalGaps ?? [],
  };
}

export function sourceLabel(source: SymbolSource): string {
  switch (source) {
    case "sds":
      return "Fra SDS";
    case "h-derived":
      return "Udledt fra H-sætning";
    case "sds-section-8":
      return "Fra SDS sektion 8";
    case "worktask":
      return "Fra arbejdsopgave";
    case "suggestion":
      return "Forslag – kræver faglig vurdering";
    case "missing":
      return "Mangler oplysninger";
  }
}
