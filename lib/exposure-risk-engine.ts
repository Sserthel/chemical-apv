import { SDS_MISSING } from "./sds-extract";
import type { SdsDataForAssessment, WorkTaskData } from "./risk-assessment-types";

export type MatrixRiskLevel = "lav" | "middel" | "høj" | "kritisk";
export type ConfidenceLevel = "høj" | "middel" | "lav";
export type UncertaintyLevel = "lav" | "middel" | "høj";

export type ExposurePathway = "hud" | "øjne" | "indånding" | "brand" | "miljø";

export interface ControlReduction {
  measure: string;
  pathway: ExposurePathway;
  effect: string;
  exposureDelta: number;
  likelihoodDelta: number;
}

export interface PathwayRisk {
  pathway: ExposurePathway;
  label: string;
  /** Intrinsisk fare fra SDS/H-koder – reduceres ikke af PPE */
  hazard: number;
  hazardLabel: MatrixRiskLevel;
  /** Eksponering før kontrolforanstaltninger */
  exposureBefore: number;
  exposureBeforeLabel: MatrixRiskLevel;
  /** Eksponering efter kontrolforanstaltninger */
  exposureAfter: number;
  exposureAfterLabel: MatrixRiskLevel;
  likelihoodBefore: number;
  likelihoodBeforeLabel: MatrixRiskLevel;
  likelihoodAfter: number;
  likelihoodAfterLabel: MatrixRiskLevel;
  riskScoreBefore: number;
  riskBefore: MatrixRiskLevel;
  riskScoreAfter: number;
  riskAfter: MatrixRiskLevel;
  riskScoreResidual: number;
  riskResidual: MatrixRiskLevel;
  controlReductions: ControlReduction[];
  reductionReasons: string[];
  justification: string;
  hazardFactors: string[];
  exposureFactors: string[];
}

export interface CriticalGap {
  priority: "P1" | "P2" | "P3";
  message: string;
}

export interface PrioritizedAction {
  priority: "P1" | "P2" | "P3";
  action: string;
  rationale: string;
}

export interface ExposureRiskResult {
  pathways: PathwayRisk[];
  overallBefore: MatrixRiskLevel;
  overallAfter: MatrixRiskLevel;
  overallResidual: MatrixRiskLevel;
  overallScoreBefore: number;
  overallScoreResidual: number;
  criticalGaps: CriticalGap[];
  criticalWarnings: string[];
  recommendedActions: PrioritizedAction[];
  dataQualityScore: number;
  assessmentConfidence: ConfidenceLevel;
  uncertaintyLevel: UncertaintyLevel;
  controlSummary: string[];
  summary: string;
}

const PATHWAY_LABELS: Record<ExposurePathway, string> = {
  hud: "Hud",
  øjne: "Øjne",
  indånding: "Indånding",
  brand: "Brand",
  miljø: "Miljø",
};

function clamp(n: number, min = 1, max = 4): number {
  return Math.max(min, Math.min(max, Math.round(n * 10) / 10));
}

function sumToLevel(score: number): MatrixRiskLevel {
  if (score <= 5) return "lav";
  if (score <= 7) return "middel";
  if (score <= 9) return "høj";
  return "kritisk";
}

function numToLevel(n: number): MatrixRiskLevel {
  if (n <= 1) return "lav";
  if (n <= 2) return "middel";
  if (n <= 3) return "høj";
  return "kritisk";
}

function levelRank(l: MatrixRiskLevel): number {
  return { lav: 1, middel: 2, høj: 3, kritisk: 4 }[l];
}

function maxLevel(...levels: MatrixRiskLevel[]): MatrixRiskLevel {
  return levels.reduce((a, b) => (levelRank(b) > levelRank(a) ? b : a), "lav");
}

function hasH(h: string[], patterns: RegExp[]): string[] {
  return h.filter((code) => patterns.some((p) => p.test(code.toUpperCase())));
}

function textImplies(text: string, words: RegExp[]): boolean {
  const t = text.toLowerCase();
  return words.some((w) => w.test(t));
}

function parseTier(
  text: string,
  low: RegExp[],
  high: RegExp[]
): { tier: number; label: string } {
  const t = text.toLowerCase().trim();
  if (!t) return { tier: 2, label: "ikke angivet (middel antaget)" };
  if (low.some((r) => r.test(t)))
    return { tier: 1, label: "lav" };
  if (high.some((r) => r.test(t)))
    return { tier: 3, label: "høj" };
  if (/moderat|normal|medium/i.test(t)) return { tier: 2, label: "middel" };
  return { tier: 2, label: "middel" };
}

function hazardFromH(
  h: string[],
  pathway: ExposurePathway
): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 1;

  const bump = (codes: string[], pts: number, desc: string) => {
    const found = hasH(h, codes.map((c) => new RegExp(`^${c}`, "i")));
    if (found.length) {
      score = Math.max(score, pts);
      factors.push(`${found.join(", ")} – ${desc}`);
    }
  };

  switch (pathway) {
    case "øjne":
      bump(["H314", "H318"], 4, "alvorlig øjenskade");
      bump(["H319"], 2, "irritation");
      break;
    case "hud":
      bump(["H314"], 4, "ætsende");
      bump(["H310", "H311", "H312"], 4, "toksisk hud");
      bump(["H315", "H317"], 2, "irritation/sensibilisering");
      break;
    case "indånding":
      bump(["H330", "H331"], 4, "akut toksisk indånding");
      bump(["H332"], 3, "skadelig indånding");
      bump(["H334"], 3, "allergi");
      bump(["H336", "H335"], 2, "irritation/sløvhed");
      bump(["H372", "H373"], 3, "langtidsskade");
      break;
    case "brand":
      bump(["H224", "H225"], 4, "meget brandfarlig");
      bump(["H226", "H228"], 3, "brandfarlig");
      break;
    case "miljø":
      bump(["H400", "H410"], 3, "miljøfarlig");
      bump(["H411", "H412"], 2, "vandmiljø");
      break;
  }

  if (!factors.length && h.length) {
    score = 2;
    factors.push("Generel fare fra SDS – middel antaget");
  } else if (!h.length) {
    score = 2;
    factors.push("Ingen H-sætninger – usikkerhed");
  }

  return { score: clamp(score), factors };
}

function baseExposure(
  work: WorkTaskData,
  pathway: ExposurePathway
): { exposure: number; likelihood: number; factors: string[] } {
  const factors: string[] = [];

  const freq = parseTier(
    work.hyppighed,
    [/sjælden|måned|kvart|få gange|ugentlig/i, /lav/i],
    [/daglig|hver dag|konstant|flere gange dagligt/i]
  );
  const qty = parseTier(
    work.maengdePrGang,
    [/ml|spart|dråbe|lille|få|minimal|under 100/i, /små/i],
    [/liter|kg|stor|> ?500|meget/i]
  );
  const dur = parseTier(
    work.varighedPrGang,
    [/minut|kort|< ?15|5 min|10 min/i],
    [/\d+\s*h|timer|hel dag|lang/i]
  );

  let exposure = clamp((freq.tier + qty.tier + dur.tier) / 3);
  let likelihood = clamp((freq.tier + dur.tier) / 2);

  factors.push(`Hyppighed ${freq.label} (${work.hyppighed || "—"})`);
  factors.push(`Mængde ${qty.label} (${work.maengdePrGang || "—"})`);
  factors.push(`Varighed ${dur.label} (${work.varighedPrGang || "—"})`);

  if (work.procesType === "lukket") {
    exposure = clamp(exposure - 1);
    likelihood = clamp(likelihood - 1);
    factors.push("Lukket proces – lavere eksponering");
  } else {
    factors.push("Åben proces");
  }

  if (pathway === "indånding") {
    if (work.sprayAerosol === "ja") {
      exposure = clamp(exposure + 2);
      likelihood = clamp(likelihood + 1);
      factors.push("Spray/aerosol øger indånding");
    } else {
      factors.push("Ingen spray – lavere inhalationsrisiko");
    }
    if (work.opvarmning === "ja") {
      exposure = clamp(exposure + 1);
      factors.push("Opvarmning");
    }
    if (work.stoefudvikling === "ja") {
      exposure = clamp(exposure + 1);
      factors.push("Støv");
    }
    if (textImplies(work.risikoIndaanding, [/høj|stor/i])) {
      exposure = clamp(exposure + 1);
      factors.push(`Angivet indåndingsrisiko: ${work.risikoIndaanding}`);
    }
  }

  if (pathway === "øjne" && textImplies(work.risikoOejnkontakt, [/høj|stænk|sprøjt/i])) {
    exposure = clamp(exposure + 1);
    likelihood = clamp(likelihood + 1);
    factors.push(`Angivet øjenrisiko: ${work.risikoOejnkontakt}`);
  }

  if (pathway === "hud" && textImplies(work.risikoHudkontakt, [/høj|våd|æts/i])) {
    exposure = clamp(exposure + 1);
    factors.push(`Angivet hudkontakt: ${work.risikoHudkontakt}`);
  }

  if (pathway === "brand" && work.opvarmning === "ja") {
    likelihood = clamp(likelihood + 1);
  }

  return { exposure, likelihood, factors };
}

interface DetectedControls {
  nitril: boolean;
  handsker: boolean;
  oejen: boolean;
  ansigtsskaerm: boolean;
  aandedraet: boolean;
  punktudsug: boolean;
  ventilation: boolean;
  lukket: boolean;
  instruktion: boolean;
  traening: boolean;
  lavFrekvens: boolean;
  lilleMaengde: boolean;
  kortVarighed: boolean;
  ingenSpray: boolean;
}

function detectControls(
  work: WorkTaskData,
  sds: SdsDataForAssessment
): DetectedControls {
  const ppe = `${work.vaernemidler} ${sds.ppe.handProtection} ${sds.ppe.eyeProtection} ${sds.ppe.respiratoryProtection} ${sds.ppe.skinProtection} ${sds.ppe.ventilation}`.toLowerCase();
  const all = `${ppe} ${work.ventilation} ${work.eksisterendeInstruktion}`.toLowerCase();

  return {
    nitril: /nitril/i.test(all),
    handsker: /handske|glove/i.test(all),
    oejen: /brille|beskyttelsesbrille|øjen/i.test(all),
    ansigtsskaerm: /ansigtsskærm|visir|face shield/i.test(all),
    aandedraet: /åndedræt|respirator|filter|maske|p3|a2|ffp/i.test(all),
    punktudsug: work.punktudsugning === "ja" || /punktudsug|local exhaust/i.test(all),
    ventilation:
      (work.ventilation.trim().length > 2 &&
        !/ingen|utilstrækkelig/i.test(work.ventilation)) ||
      /ventilation|udsug/i.test(all),
    lukket: work.procesType === "lukket",
    instruktion: work.eksisterendeInstruktion.trim().length > 10,
    traening: /træning|instrueret|kursus|oplært/i.test(all),
    lavFrekvens: /sjælden|måned|kvart|ugent|få gange|lav/i.test(
      work.hyppighed.toLowerCase()
    ),
    lilleMaengde: /ml|spart|lille|små|minimal|under/i.test(
      work.maengdePrGang.toLowerCase()
    ),
    kortVarighed: /minut|kort|< ?15|5 min/i.test(
      work.varighedPrGang.toLowerCase()
    ),
    ingenSpray: work.sprayAerosol === "nej",
  };
}

function applyControls(
  pathway: ExposurePathway,
  exposure: number,
  likelihood: number,
  controls: DetectedControls
): {
  exposureAfter: number;
  likelihoodAfter: number;
  reductions: ControlReduction[];
  reasons: string[];
} {
  const reductions: ControlReduction[] = [];
  const reasons: string[] = [];
  let exp = exposure;
  let like = likelihood;

  const add = (
    measure: string,
    expD: number,
    likeD: number,
    effect: string
  ) => {
    if (expD === 0 && likeD === 0) return;
    exp = clamp(exp - expD);
    like = clamp(like - likeD);
    reductions.push({
      measure,
      pathway,
      effect,
      exposureDelta: expD,
      likelihoodDelta: likeD,
    });
    reasons.push(`${measure}: ${effect} (${PATHWAY_LABELS[pathway]})`);
  };

  if (controls.lukket) {
    add("Lukket proces", 1.5, 1, "kraftigt reduceret eksponering");
  }
  if (controls.lavFrekvens) {
    add("Lav hyppighed", 0, 1, "reduceret sandsynlighed");
  }
  if (controls.lilleMaengde) {
    add("Lille mængde", 1, 0, "reduceret eksponeringsniveau");
  }
  if (controls.kortVarighed) {
    add("Kort varighed", 1, 0.5, "reduceret eksponering og sandsynlighed");
  }
  if (controls.ingenSpray && pathway === "indånding") {
    add("Ingen spray/aerosol", 1.5, 1, "væsentligt lavere inhalation");
  }

  if (pathway === "hud") {
    if (controls.nitril) {
      add("Nitrilhandsker", 2, 0.5, "betydeligt reduceret hudeksponering");
    } else if (controls.handsker) {
      add("Handsker", 1.5, 0, "reduceret hudeksponering");
    }
  }

  if (pathway === "øjne") {
    if (controls.ansigtsskaerm) {
      add("Ansigtsskærm", 2, 1, "væsentligt reduceret øjenrisiko");
    } else if (controls.oejen) {
      add("Øjenbeskyttelse", 1, 0.5, "reduceret øjenrisiko");
    }
  }

  if (pathway === "indånding") {
    if (controls.punktudsug) {
      add("Punktudsugning", 2, 0.5, "reduceret dampe/aerosol");
    }
    if (controls.ventilation) {
      add("Ventilation", 1, 0, "forbedret luftskifte");
    }
    if (controls.aandedraet) {
      add("Åndedrætsværn", 1.5, 0.5, "reduceret inhalation");
    }
  }

  if (controls.instruktion) {
    add("Eksisterende instruktion", 0, 0.5, "reduceret fejlrisiko");
  }
  if (controls.traening) {
    add("Træning/oplæring", 0, 0.5, "reduceret sandsynlighed for fejl");
  }

  return {
    exposureAfter: exp,
    likelihoodAfter: like,
    reductions,
    reasons,
  };
}

function assessPathway(
  pathway: ExposurePathway,
  sds: SdsDataForAssessment,
  work: WorkTaskData,
  controls: DetectedControls
): PathwayRisk {
  const haz = hazardFromH(sds.hStatements, pathway);
  const base = baseExposure(work, pathway);

  const scoreBefore = haz.score + base.exposure + base.likelihood;
  const riskBefore = sumToLevel(scoreBefore);

  const after = applyControls(
    pathway,
    base.exposure,
    base.likelihood,
    controls
  );

  const scoreAfter = haz.score + after.exposureAfter + after.likelihoodAfter;
  let riskAfter = sumToLevel(scoreAfter);
  let riskResidual = riskAfter;

  // Kritisk kun ved meget høj kombination – ikke bare høj fare alene
  if (riskBefore === "kritisk" && scoreAfter <= 7) {
    riskAfter = sumToLevel(scoreAfter);
    riskResidual = riskAfter;
  }

  // Cap: lav eksponering + kontroller → max høj, sjældent kritisk rest
  if (
    after.exposureAfter <= 1.5 &&
    after.likelihoodAfter <= 2 &&
    after.reductions.length >= 2 &&
    riskResidual === "kritisk"
  ) {
    riskResidual = "høj";
  }
  if (
    after.exposureAfter <= 1 &&
    after.likelihoodAfter <= 1.5 &&
    (controls.handsker || controls.nitril) &&
    controls.ingenSpray &&
    riskResidual !== "lav"
  ) {
    riskResidual = scoreAfter <= 5 ? "lav" : "middel";
    riskAfter = riskResidual;
  }

  const justification = buildJustification(
    pathway,
    haz,
    base,
    after,
    riskBefore,
    riskAfter,
    riskResidual
  );

  return {
    pathway,
    label: PATHWAY_LABELS[pathway],
    hazard: haz.score,
    hazardLabel: numToLevel(haz.score),
    exposureBefore: base.exposure,
    exposureBeforeLabel: numToLevel(base.exposure),
    exposureAfter: after.exposureAfter,
    exposureAfterLabel: numToLevel(after.exposureAfter),
    likelihoodBefore: base.likelihood,
    likelihoodBeforeLabel: numToLevel(base.likelihood),
    likelihoodAfter: after.likelihoodAfter,
    likelihoodAfterLabel: numToLevel(after.likelihoodAfter),
    riskScoreBefore: scoreBefore,
    riskBefore,
    riskScoreAfter: scoreAfter,
    riskAfter,
    riskScoreResidual: scoreAfter,
    riskResidual,
    controlReductions: after.reductions,
    reductionReasons: after.reasons,
    justification,
    hazardFactors: haz.factors,
    exposureFactors: base.factors,
  };
}

function buildJustification(
  pathway: ExposurePathway,
  haz: { score: number; factors: string[] },
  base: { exposure: number; likelihood: number; factors: string[] },
  after: ReturnType<typeof applyControls>,
  before: MatrixRiskLevel,
  afterLevel: MatrixRiskLevel,
  residual: MatrixRiskLevel
): string {
  const label = PATHWAY_LABELS[pathway].toLowerCase();
  const h = haz.factors[0] ?? "SDS-fare";
  const red =
    after.reasons.length > 0
      ? ` Kontrol: ${after.reasons.slice(0, 2).join("; ")}.`
      : "";
  return `${before.charAt(0).toUpperCase() + before.slice(1)} ${label}risiko (fare ${haz.score}/4, eksponering ${base.exposure}/4) pga. ${h}. Efter foranstaltninger: ${afterLevel}, rest: ${residual}.${red}`;
}

function computeDataQuality(
  sds: SdsDataForAssessment,
  work: WorkTaskData
): {
  score: number;
  confidence: ConfidenceLevel;
  uncertainty: UncertaintyLevel;
} {
  let score = 0;
  const checks = [
    sds.hStatements.length > 0,
    sds.productName !== SDS_MISSING,
    sds.ppe.handProtection !== SDS_MISSING,
    sds.firstAid.eyes !== SDS_MISSING,
    sds.missingFields.length < 8,
    work.arbejdsopgave.trim().length > 5,
    work.hyppighed.trim().length > 0,
    work.maengdePrGang.trim().length > 0,
    work.vaernemidler.trim().length > 0,
    work.ventilation.trim().length > 0 || work.punktudsugning === "ja",
  ];
  score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  let confidence: ConfidenceLevel = "middel";
  let uncertainty: UncertaintyLevel = "middel";
  if (score >= 80) {
    confidence = "høj";
    uncertainty = "lav";
  } else if (score >= 55) {
    confidence = "middel";
    uncertainty = "middel";
  } else {
    confidence = "lav";
    uncertainty = "høj";
  }
  if (sds.missingFields.length > 10) uncertainty = "høj";
  if (!sds.hStatements.length) {
    confidence = "lav";
    uncertainty = "høj";
  }

  return { score, confidence, uncertainty };
}

function detectCriticalGaps(
  sds: SdsDataForAssessment,
  work: WorkTaskData,
  pathways: PathwayRisk[],
  controls: DetectedControls
): CriticalGap[] {
  const gaps: CriticalGap[] = [];
  const h = sds.hStatements;

  if (
    hasH(h, [/^H314/]).length > 0 &&
    !/skyl|øjenskyl|nødbrus|emergency shower/i.test(
      `${work.eksisterendeInstruktion} ${sds.firstAid.eyes} ${work.afdeling}`
    )
  ) {
    gaps.push({
      priority: "P1",
      message: "H314 uden dokumenteret øjenskyl/nødbruser.",
    });
  }

  if (
    hasH(h, [/^H350/, /^H340/, /^H360/]).length > 0 &&
    !/substitut|erstat|alternativ/i.test(work.eksisterendeInstruktion)
  ) {
    gaps.push({
      priority: "P1",
      message: "H350/CMR – substitutionsvurdering ikke dokumenteret.",
    });
  }

  if (
    work.sprayAerosol === "ja" &&
    !controls.ventilation &&
    !controls.punktudsug &&
    !controls.aandedraet
  ) {
    gaps.push({
      priority: "P1",
      message: "Spray uden ventilation, punktudsugning eller åndedrætsværn.",
    });
  }

  const inhale = pathways.find((p) => p.pathway === "indånding");
  if (
    inhale &&
    inhale.exposureBefore >= 3 &&
    !controls.aandedraet &&
    !controls.punktudsug &&
    !controls.ventilation
  ) {
    gaps.push({
      priority: "P1",
      message: "Høj indåndingseksponering uden adequate kontrolforanstaltninger.",
    });
  }

  const eye = pathways.find((p) => p.pathway === "øjne");
  if (
    hasH(h, [/^H314/]).length > 0 &&
    !controls.ansigtsskaerm &&
    !controls.oejen &&
    eye &&
    eye.exposureBefore >= 2
  ) {
    gaps.push({
      priority: "P1",
      message: "Mangler øjen-/ansigtsbeskyttelse ved H314.",
    });
  }

  if (work.punktudsugning === "nej" && work.sprayAerosol === "ja") {
    gaps.push({
      priority: "P2",
      message: "Spray i åben proces uden punktudsugning.",
    });
  }

  if (!work.arbejdsopgave.trim()) {
    gaps.push({ priority: "P2", message: "Arbejdsopgave ikke beskrevet." });
  }

  return gaps;
}

function buildActions(
  gaps: CriticalGap[],
  pathways: PathwayRisk[]
): PrioritizedAction[] {
  const actions: PrioritizedAction[] = gaps.map((g) => ({
    priority: g.priority,
    action: g.message,
    rationale: "Kritisk gap – risikomotor",
  }));

  for (const p of pathways.filter((x) => levelRank(x.riskResidual) >= 3)) {
    actions.push({
      priority: "P2",
      action: `Yderligere tiltag for ${p.label} (rest: ${p.riskResidual})`,
      rationale: p.justification,
    });
  }

  return actions.slice(0, 12);
}

export function computeExposureRisk(
  sds: SdsDataForAssessment,
  work: WorkTaskData
): ExposureRiskResult {
  const controls = detectControls(work, sds);
  const pathways: ExposurePathway[] = [
    "hud",
    "øjne",
    "indånding",
    "brand",
    "miljø",
  ];
  const pathwayResults = pathways.map((p) =>
    assessPathway(p, sds, work, controls)
  );

  let overallBefore = maxLevel(...pathwayResults.map((p) => p.riskBefore));
  let overallAfter = maxLevel(...pathwayResults.map((p) => p.riskAfter));
  let overallResidual = maxLevel(
    ...pathwayResults.map((p) => p.riskResidual)
  );

  const criticalGaps = detectCriticalGaps(sds, work, pathwayResults, controls);

  // P1 gaps kan hæve rest-risiko – men ikke automatisk til kritisk for lav eksponering
  if (criticalGaps.some((g) => g.priority === "P1")) {
    if (overallResidual === "lav") overallResidual = "middel";
    else if (
      overallResidual === "middel" &&
      pathwayResults.some((p) => p.hazard >= 4 && p.exposureBefore >= 3)
    ) {
      overallResidual = "høj";
    }
  }

  // Rengøringsscenario: cap rest-risiko
  const isLowRoutine =
    controls.lilleMaengde &&
    controls.lavFrekvens &&
    (controls.handsker || controls.nitril) &&
    controls.ingenSpray &&
    !criticalGaps.some((g) => g.priority === "P1");

  if (isLowRoutine && overallResidual === "kritisk") {
    overallResidual = "høj";
  }
  if (isLowRoutine && levelRank(overallResidual) >= 3) {
    overallResidual = "middel";
  }

  const quality = computeDataQuality(sds, work);

  const controlSummary = pathwayResults.flatMap((p) =>
    p.reductionReasons.length
      ? [`【${p.label}】 ${p.reductionReasons.join(" | ")}`]
      : []
  );

  const criticalWarnings = criticalGaps
    .filter((g) => g.priority === "P1")
    .map((g) => `⚠ ${g.message}`);

  const recommendedActions = buildActions(criticalGaps, pathwayResults);

  const summary = [
    `Fare×eksponering×sandsynlighed før kontrol: ${overallBefore.toUpperCase()}.`,
    `Efter kontrolforanstaltninger: ${overallAfter.toUpperCase()}.`,
    `Rest-risiko: ${overallResidual.toUpperCase()}.`,
    `Datakvalitet: ${quality.score}% · Konfidens: ${quality.confidence} · Usikkerhed: ${quality.uncertainty}.`,
    criticalGaps.length
      ? `${criticalGaps.length} kritisk(e) forhold.`
      : "Ingen P1-forhold.",
  ].join(" ");

  return {
    pathways: pathwayResults,
    overallBefore,
    overallAfter,
    overallResidual,
    overallScoreBefore: Math.max(
      ...pathwayResults.map((p) => p.riskScoreBefore)
    ),
    overallScoreResidual: Math.max(
      ...pathwayResults.map((p) => p.riskScoreResidual)
    ),
    criticalGaps,
    criticalWarnings,
    recommendedActions,
    dataQualityScore: quality.score,
    assessmentConfidence: quality.confidence,
    uncertaintyLevel: quality.uncertainty,
    controlSummary,
    summary,
  };
}

export const MATRIX_LEVEL_ORDER: MatrixRiskLevel[] = [
  "lav",
  "middel",
  "høj",
  "kritisk",
];

export function levelColor(level: MatrixRiskLevel): string {
  switch (level) {
    case "lav":
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    case "middel":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "høj":
      return "bg-orange-100 text-orange-900 border-orange-300";
    case "kritisk":
      return "bg-red-100 text-red-900 border-red-300";
  }
}