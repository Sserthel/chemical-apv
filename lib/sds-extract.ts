/**
 * Udtrækker strukturerede SDS-data fra PDF-tekst.
 * Opfinder ikke data – kun det der findes i teksten.
 */

export const SDS_MISSING = "Mangler oplysninger";

export interface SdsPpe {
  respiratoryProtection: string;
  handProtection: string;
  eyeProtection: string;
  skinProtection: string;
  ventilation: string;
}

export interface SdsFirstAid {
  inhalation: string;
  skin: string;
  eyes: string;
  ingestion: string;
}

export interface SdsFireFighting {
  suitableExtinguishingMedia: string;
  specialHazards: string;
  protectiveEquipment: string;
}

export interface SdsSourceSection {
  section: number;
  title: string;
  excerpt: string;
}

export interface SdsFullData {
  productName: string;
  supplier: string;
  sdsDate: string;
  signalWord: string;
  hazardPictograms: string[];
  hStatements: string[];
  pStatements: string[];
  ingredients: string[];
  casNumbers: string[];
  exposureLimits: string[];
  ppe: SdsPpe;
  firstAid: SdsFirstAid;
  fireFighting: SdsFireFighting;
  spillResponse: string;
  handling: string;
  storage: string;
  incompatibleMaterials: string;
  disposal: string;
  environmentalPrecautions: string;
  regulatoryInfo: string;
  missingFields: string[];
  sourceSections: SdsSourceSection[];
}

const H_CODE = /\bH\d{3}(?:[A-Za-z]\d?)?\b/gi;
const P_CODE = /\bP\d{3}(?:\d{3})?\b/gi;
const CAS_CODE = /\b\d{2,7}-\d{2}-\d\b/g;
const GHS_PICTO = /\bGHS\s*0?\d{1,2}\b/gi;
const EXPOSURE_LIMIT =
  /(?:grænseværdi|grænseværdier|oel|tlv|pel|mac|exposure\s+limit)[^\n]{0,200}|\d+[\.,]?\d*\s*(?:mg\/m³|mg\/m3|ppm)\b/gi;

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\t/g, " ").replace(/ +/g, " ");
}

function uniqueMatches(text: string, pattern: RegExp): string[] {
  const matches = text.match(pattern) ?? [];
  const seen = new Set<string>();
  for (const m of matches) {
    seen.add(m.toUpperCase().replace(/\s+/g, ""));
  }
  return [...seen].sort();
}

function trimExcerpt(text: string, max = 1200): string {
  return text.trim().replace(/\s{2,}/g, " ").slice(0, max);
}

function isMissing(value: string | null | undefined): boolean {
  return !value?.trim() || value.trim() === SDS_MISSING;
}

/** Del tekst op i SDS-sektioner 1–16 */
export function splitSdsSections(text: string): Map<number, string> {
  const normalized = normalize(text);
  const sections = new Map<number, string>();

  const headerRegex =
    /(?:^|\n)\s*(?:SEKTION\s+|PUNKT\s+|SECTION\s+)?(1[0-6]|[1-9])[\.\):\-]\s*([^\n]{0,120})/gi;

  const hits: { num: number; index: number; header: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(normalized)) !== null) {
    const num = parseInt(m[1], 10);
    if (num >= 1 && num <= 16) {
      hits.push({ num, index: m.index, header: m[0].trim() });
    }
  }

  hits.sort((a, b) => a.index - b.index);

  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index;
    const end = i + 1 < hits.length ? hits[i + 1].index : normalized.length;
    const body = normalized.slice(start, end);
    const existing = sections.get(hits[i].num);
    if (!existing || body.length > existing.length) {
      sections.set(hits[i].num, body);
    }
  }

  return sections;
}

function getSection(
  sections: Map<number, string>,
  num: number
): string {
  return sections.get(num) ?? "";
}

function extractLabeled(
  sectionText: string,
  labels: RegExp[],
  maxLen = 600
): string {
  for (const label of labels) {
    const re = new RegExp(
      `(?:${label.source})\\s*[:\\-]?\\s*([^\\n]+(?:\\n(?!\\s*(?:${label.source}))[^\\n]+)*)`,
      "i"
    );
    const match = sectionText.match(re);
    if (match?.[1]) {
      const v = trimExcerpt(match[1], maxLen);
      if (v.length > 3) return v;
    }
  }
  return SDS_MISSING;
}

function extractSubsection(
  sectionText: string,
  labels: RegExp[]
): string {
  for (const label of labels) {
    const idx = sectionText.search(label);
    if (idx < 0) continue;
    const rest = sectionText.slice(idx);
    const nextHeader = rest.slice(20).search(/\n\s*(?:ved|ved\s|efter|indånding|hud|øje|øjne|indtagelse|inhalation|skin|eyes)/i);
    const chunk =
      nextHeader > 0 ? rest.slice(0, 20 + nextHeader) : rest.slice(0, 500);
    const cleaned = chunk.replace(label, "").replace(/^[\s:.\-]+/, "").trim();
    if (cleaned.length > 10) return trimExcerpt(cleaned, 500);
  }
  return SDS_MISSING;
}

function buildSourceSections(sections: Map<number, string>): SdsSourceSection[] {
  const titles: Record<number, string> = {
    1: "Produktidentifikation",
    2: "Fareidentifikation",
    3: "Sammensætning",
    4: "Førstehjælp",
    5: "Brandbekæmpelse",
    6: "Udslip ved uheld",
    7: "Håndtering og opbevaring",
    8: "Eksponeringskontrol/værnemidler",
    10: "Stabilitet og reaktivitet",
    11: "Toksikologiske oplysninger",
    13: "Bortskaffelse",
    15: "Regulering",
  };

  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 15];
  return nums
    .filter((n) => sections.has(n))
    .map((n) => ({
      section: n,
      title: titles[n] ?? `Sektion ${n}`,
      excerpt: trimExcerpt(sections.get(n)!, 400),
    }));
}

function collectExposureLimits(s8: string, s11: string): string[] {
  const combined = `${s8}\n${s11}`;
  const found = new Set<string>();
  for (const m of combined.match(EXPOSURE_LIMIT) ?? []) {
    found.add(m.trim().slice(0, 200));
  }
  const lines = combined.split("\n").filter((l) =>
    /mg\/m|ppm|grænseværdi|oel|tlv/i.test(l)
  );
  for (const l of lines.slice(0, 8)) {
    const t = l.trim();
    if (t.length > 8 && t.length < 250) found.add(t);
  }
  return [...found].slice(0, 12);
}

function collectIngredients(s3: string): string[] {
  if (!s3.trim()) return [];
  const lines = s3
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.length > 5 &&
        l.length < 200 &&
        !/^sektion|^punkt|^\d+[\.\)]/i.test(l)
    );
  return lines.slice(0, 15);
}

export function extractSdsData(pdfText: string): SdsFullData {
  const normalized = normalize(pdfText);
  const sections = splitSdsSections(normalized);

  const s1 = getSection(sections, 1);
  const s2 = getSection(sections, 2);
  const s3 = getSection(sections, 3);
  const s4 = getSection(sections, 4);
  const s5 = getSection(sections, 5);
  const s6 = getSection(sections, 6);
  const s7 = getSection(sections, 7);
  const s8 = getSection(sections, 8);
  const s10 = getSection(sections, 10);
  const s11 = getSection(sections, 11);
  const s13 = getSection(sections, 13);
  const s15 = getSection(sections, 15);

  const fullForCodes = normalized;
  const hStatements = uniqueMatches(
    s2.length > 20 ? s2 : fullForCodes,
    H_CODE
  );
  const pStatements = uniqueMatches(
    [s2, s7, s8].join("\n").length > 20
      ? [s2, s7, s8].join("\n")
      : fullForCodes,
    P_CODE
  );

  const casFromS3 = uniqueMatches(s3, CAS_CODE);
  const casFromAll = uniqueMatches(fullForCodes, CAS_CODE);
  const casNumbers = [...new Set([...casFromS3, ...casFromAll])].slice(0, 20);

  const productName =
    extractLabeled(s1, [
      /produktnavn/i,
      /produktbetegnelse/i,
      /handelsnavn/i,
      /product\s+name/i,
      /trade\s+name/i,
      /navn på stof/i,
      /navn på blanding/i,
    ]) ||
    (s1.match(/(?:^|\n)\s*1\.1\s+[^\n]*\n\s*([^\n]{3,100})/i)?.[1]?.trim() ??
      SDS_MISSING);

  const supplier = extractLabeled(s1, [
    /leverandør/i,
    /supplier/i,
    /firma/i,
    /producent/i,
    /manufacturer/i,
  ]);

  const sdsDate = extractLabeled(
    s1 + "\n" + normalized.slice(0, 800),
    [
      /revision\s*dato/i,
      /udgivelsesdato/i,
      /date\s+of\s+issue/i,
      /revision\s+date/i,
      /version/i,
      /senest\s+revideret/i,
    ],
    120
  );

  const signalWord = extractLabeled(s2, [
    /signalord/i,
    /signal\s+word/i,
    /\b(Fare|Advarsel|Danger|Warning)\b/,
  ]);

  let hazardPictograms = uniqueMatches(s2, GHS_PICTO);
  if (hazardPictograms.length === 0) {
    const pictoWords = s2.match(
      /(?:farepiktogram|pictogram|ghs)[^\n]{0,200}/gi
    );
    if (pictoWords) hazardPictograms = pictoWords.slice(0, 6);
  }

  const ingredients = collectIngredients(s3);
  const exposureLimits = collectExposureLimits(s8, s11);

  const ppe: SdsPpe = {
    respiratoryProtection: extractLabeled(s8, [
      /åndedrætsværn/i,
      /respiratory\s+protection/i,
      /åndedrætss?filter/i,
    ]),
    handProtection: extractLabeled(s8, [
      /håndbeskyttelse/i,
      /hand\s+protection/i,
      /handsker/i,
      /gloves/i,
    ]),
    eyeProtection: extractLabeled(s8, [
      /øjenbeskyttelse/i,
      /eye\s+protection/i,
      /beskyttelsesbriller/i,
    ]),
    skinProtection: extractLabeled(s8, [
      /hudbeskyttelse/i,
      /kropsbeskyttelse/i,
      /skin\s+protection/i,
      /body\s+protection/i,
      /beskyttelsestøj/i,
    ]),
    ventilation: extractLabeled(s8, [
      /ventilation/i,
      /punktudsugning/i,
      /local\s+exhaust/i,
      /udsugning/i,
    ]),
  };

  const firstAid: SdsFirstAid = {
    inhalation: extractSubsection(s4, [
      /indånding/i,
      /inhalation/i,
      /ved\s+indånding/i,
    ]),
    skin: extractSubsection(s4, [/hudkontakt/i, /hud/i, /skin/i]),
    eyes: extractSubsection(s4, [/øjne/i, /øjenkontakt/i, /eyes/i]),
    ingestion: extractSubsection(s4, [/indtagelse/i, /ingestion/i]),
  };

  const fireFighting: SdsFireFighting = {
    suitableExtinguishingMedia: extractLabeled(s5, [
      /slukningsmidler/i,
      /egnede\s+slukningsmidler/i,
      /suitable\s+extinguishing/i,
      /extinguishing\s+media/i,
    ]),
    specialHazards: extractLabeled(s5, [
      /særlige\s+farer/i,
      /farer\s+ved\s+brand/i,
      /special\s+hazards/i,
    ]),
    protectiveEquipment: extractLabeled(s5, [
      /værnemidler\s+for\s+brandslukningspersonale/i,
      /protective\s+equipment.*fire/i,
      /brandslukningspersonale/i,
    ]),
  };

  const spillResponse =
    s6.trim().length > 30
      ? trimExcerpt(s6.replace(/^[^\n]+\n/, ""), 1000)
      : SDS_MISSING;

  const s7parts = s7.split(/\n\s*7\.[12]/i);
  const handling =
    s7parts[0]?.trim().length > 30
      ? trimExcerpt(s7parts[0], 800)
      : s7.trim().length > 30
        ? trimExcerpt(s7, 400)
        : SDS_MISSING;

  const storage =
    s7parts[1]?.trim().length > 20
      ? trimExcerpt(s7parts[1], 800)
      : extractLabeled(s7, [/opbevaring/i, /storage/i]);

  const incompatibleMaterials =
    s10.trim().length > 30
      ? extractLabeled(s10, [
          /uforenelige/i,
          /materialer\s+der\s+skal\s+undgås/i,
          /incompatible/i,
          /conditions\s+to\s+avoid/i,
        ])
      : SDS_MISSING;

  const disposal =
    s13.trim().length > 30
      ? trimExcerpt(s13.replace(/^[^\n]+\n/, ""), 1000)
      : SDS_MISSING;

  const environmentalPrecautions = extractLabeled(s6 + "\n" + s13, [
    /miljø/i,
    /environmental/i,
    /ikke\s+må\s+tilføres/i,
  ]);

  const regulatoryInfo =
    s15.trim().length > 30
      ? trimExcerpt(s15.replace(/^[^\n]+\n/, ""), 1200)
      : SDS_MISSING;

  const data: SdsFullData = {
    productName: isMissing(productName) ? SDS_MISSING : productName,
    supplier: isMissing(supplier) ? SDS_MISSING : supplier,
    sdsDate: isMissing(sdsDate) ? SDS_MISSING : sdsDate,
    signalWord: isMissing(signalWord) ? SDS_MISSING : signalWord,
    hazardPictograms,
    hStatements,
    pStatements,
    ingredients,
    casNumbers,
    exposureLimits,
    ppe,
    firstAid,
    fireFighting,
    spillResponse,
    handling,
    storage: isMissing(storage) ? SDS_MISSING : storage,
    incompatibleMaterials,
    disposal,
    environmentalPrecautions: isMissing(environmentalPrecautions)
      ? SDS_MISSING
      : environmentalPrecautions,
    regulatoryInfo,
    missingFields: [],
    sourceSections: buildSourceSections(sections),
  };

  const missingFields: string[] = [];
  const check = (field: string, value: string | string[]) => {
    if (Array.isArray(value)) {
      if (value.length === 0) missingFields.push(field);
    } else if (isMissing(value)) {
      missingFields.push(field);
    }
  };

  check("produktnavn", data.productName);
  check("leverandør", data.supplier);
  check("SDS-dato/version", data.sdsDate);
  check("signalord", data.signalWord);
  check("farepiktogrammer", data.hazardPictograms);
  check("H-sætninger", data.hStatements);
  check("P-sætninger", data.pStatements);
  check("indholdsstoffer", data.ingredients);
  check("CAS-numre", data.casNumbers);
  check("grænseværdier", data.exposureLimits);
  check("åndedrætsværn", data.ppe.respiratoryProtection);
  check("handsker", data.ppe.handProtection);
  check("øjenbeskyttelse", data.ppe.eyeProtection);
  check("hud-/kropsbeskyttelse", data.ppe.skinProtection);
  check("ventilation", data.ppe.ventilation);
  check("førstehjælp indånding", data.firstAid.inhalation);
  check("førstehjælp hud", data.firstAid.skin);
  check("førstehjælp øjne", data.firstAid.eyes);
  check("førstehjælp indtagelse", data.firstAid.ingestion);
  check("slukningsmidler", data.fireFighting.suitableExtinguishingMedia);
  check("særlige brandfarer", data.fireFighting.specialHazards);
  check("spildhåndtering", data.spillResponse);
  check("håndtering", data.handling);
  check("opbevaring", data.storage);
  check("uforenelige materialer", data.incompatibleMaterials);
  check("bortskaffelse", data.disposal);
  check("miljøforhold", data.environmentalPrecautions);
  check("regulering", data.regulatoryInfo);

  data.missingFields = missingFields;
  return data;
}

/** PPE som liste til kemikaliekort */
export function ppeToEquipmentList(ppe: SdsPpe): string[] {
  const items: string[] = [];
  const add = (label: string, val: string) => {
    if (!isMissing(val)) items.push(`${label}: ${val.slice(0, 120)}`);
  };
  add("Åndedrætsværn", ppe.respiratoryProtection);
  add("Handsker", ppe.handProtection);
  add("Øjenbeskyttelse", ppe.eyeProtection);
  add("Hud/krop", ppe.skinProtection);
  add("Ventilation", ppe.ventilation);
  return items;
}

export function hasMissingSdsFields(data: SdsFullData): boolean {
  return data.missingFields.length > 0;
}
