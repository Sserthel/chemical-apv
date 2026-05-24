import { computeExposureRisk } from "./exposure-risk-engine";
import { evaluateRules } from "./rules-engine";
import type { Chemical } from "./types";
import { SDS_MISSING } from "./sds-extract";
import {
  RISK_SECTION_KEYS,
  SECTION_TITLES,
  type ChemicalRiskAssessment,
  type RiskAssessmentSection,
  type SdsDataForAssessment,
  type WorkTaskData,
  sdsExtractedToAssessmentData,
  sdsFullToAssessmentData,
} from "./risk-assessment-types";

const MISSING = "Mangler oplysninger";

function sdsLine(section: string, value: string | string[]): string {
  if (Array.isArray(value)) {
    return value.length > 0
      ? `[SDS ${section}] ${value.join("; ")}`
      : `[SDS ${section}] ${MISSING}`;
  }
  const v = value?.trim();
  if (!v || v === SDS_MISSING) return `[SDS ${section}] ${MISSING}`;
  return `[SDS ${section}] ${v}`;
}

function workLine(label: string, value: string): string {
  const v = value?.trim();
  return v ? `[Arbejdsopgave] ${label}: ${v}` : `[Arbejdsopgave] ${label}: ${MISSING}`;
}

function suggestionLine(text: string): string {
  return `[Forslag – kræver faglig vurdering] ${text}`;
}

function formatMatrixSection(
  calc: ReturnType<typeof computeExposureRisk>
): string {
  const header = [
    "RISIKOMATRIX (beregnet af risikomotor v2)",
    "Model: FARE (SDS) + EKSPONERING + SANDSYNLIGHED → risiko",
    "Kontrolforanstaltninger reducerer eksponering/sandsynlighed – ikke intrinsic fare",
    "",
    `Datakvalitet: ${calc.dataQualityScore}% | Konfidens: ${calc.assessmentConfidence} | Usikkerhed: ${calc.uncertaintyLevel}`,
    "",
    `SAMLET FØR kontrol: ${calc.overallBefore.toUpperCase()}`,
    `SAMLET EFTER kontrol: ${calc.overallAfter.toUpperCase()}`,
    `REST-RISIKO: ${calc.overallResidual.toUpperCase()}`,
    "",
    "─".repeat(40),
  ];

  const rows = calc.pathways.map((p) => {
    return [
      `${p.label.toUpperCase()}`,
      `  FARE (uændret): ${p.hazard}/4 (${p.hazardLabel})`,
      `  Eksponering FØR/EFTER: ${p.exposureBefore}/4 → ${p.exposureAfter}/4`,
      `  Sandsynlighed FØR/EFTER: ${p.likelihoodBefore}/4 → ${p.likelihoodAfter}/4`,
      `  Risiko FØR: ${p.riskBefore.toUpperCase()} (score ${p.riskScoreBefore})`,
      `  Risiko EFTER: ${p.riskAfter.toUpperCase()}`,
      `  REST-RISIKO: ${p.riskResidual.toUpperCase()}`,
      p.reductionReasons.length
        ? `  Reduktion: ${p.reductionReasons.join("; ")}`
        : "  Reduktion: ingen kontrolforanstaltninger registreret",
      `  Begrundelse: ${p.justification}`,
      "",
    ].join("\n");
  });

  const controlBlock =
    calc.controlSummary.length > 0
      ? ["", "KONTROLTILTAG PR. VEJ:", ...calc.controlSummary].join("\n")
      : "";

  return [...header, ...rows, controlBlock].join("\n");
}

function formatExposureSection(
  calc: ReturnType<typeof computeExposureRisk>
): string {
  return calc.pathways
    .map(
      (p) =>
        `【${p.label}】\n` +
        `FARE: ${p.hazard}/4 – ${p.hazardFactors.join(" · ")}\n` +
        `EKSPONERING: ${p.exposureBefore}/4 → ${p.exposureAfter}/4 efter kontrol\n` +
        `SANDSYNLIGHED: ${p.likelihoodBefore}/4 → ${p.likelihoodAfter}/4\n` +
        `Arbejdsfaktorer: ${p.exposureFactors.join(" · ")}\n` +
        (p.reductionReasons.length
          ? `Kontrol reducerede: ${p.reductionReasons.join(" · ")}\n`
          : "") +
        `Vurdering: ${p.justification}`
    )
    .join("\n\n");
}

function buildSections(
  sds: SdsDataForAssessment,
  work: WorkTaskData,
  flags: ReturnType<typeof evaluateRules>,
  calc: ReturnType<typeof computeExposureRisk>
): RiskAssessmentSection[] {
  const suggestionFlags = flags.filter((f) => f.isSuggestion !== false);

  const produktSds = [
    sdsLine("sektion 1", `Produkt: ${sds.productName}`),
    sdsLine("sektion 1", `Leverandør: ${sds.supplier}`),
    sdsLine("sektion 2", `H-sætninger: ${sds.hStatements.join(", ") || MISSING}`),
    sdsLine("sektion 2", `Signalord: ${sds.signalWord}`),
    `Kilde: ${sds.sdsSource}`,
  ].join("\n");

  const arbejdsopgave = [
    workLine("Arbejdsopgave", work.arbejdsopgave),
    workLine("Afdeling", work.afdeling),
    workLine("Proces", work.procesType === "åben" ? "Åben proces" : "Lukket proces"),
    workLine("Hyppighed", work.hyppighed),
    workLine("Mængde pr. gang", work.maengdePrGang),
    workLine("Varighed pr. gang", work.varighedPrGang),
    workLine("Sprøjtning/aerosol", work.sprayAerosol),
    workLine("Opvarmning", work.opvarmning),
    workLine("Ventilation", work.ventilation),
    workLine("Punktudsugning", work.punktudsugning),
  ].join("\n");

  const farlige = [
    "[SDS] Fareklassificering som grundlag for alvorlighed:",
    sdsLine("sektion 2", sds.hStatements.join(", ") || MISSING),
    sds.exposureLimits.length > 0
      ? sdsLine("sektion 8/11", `Grænseværdier: ${sds.exposureLimits.join(" | ")}`)
      : `[SDS] Grænseværdier: ${MISSING}`,
    sdsLine("sektion 10", `Uforenelige materialer: ${sds.incompatibleMaterials}`),
  ].join("\n");

  const risikomatrix = formatMatrixSection(calc);
  const eksponering = formatExposureSection(calc);

  const foranstaltninger = [
    "[Kontrolforanstaltninger – reducerer eksponering/sandsynlighed]",
    workLine("Instruktion", work.eksisterendeInstruktion),
    workLine("Værnemidler i brug", work.vaernemidler),
    workLine("Ventilation", work.ventilation),
    workLine("Punktudsugning", work.punktudsugning),
    workLine("Proces", work.procesType),
    "",
    "Registrerede reduktioner:",
    ...(calc.controlSummary.length
      ? calc.controlSummary
      : ["Ingen kontrolforanstaltninger registreret"]),
    "",
    `Beregnet risiko EFTER kontrol: ${calc.overallAfter.toUpperCase()}`,
    `Rest-risiko: ${calc.overallResidual.toUpperCase()}`,
  ].join("\n");

  const manglerItems: string[] = [
    ...sds.missingFields.map((m) => `[Mangler oplysninger] SDS: ${m}`),
  ];
  if (!work.arbejdsopgave.trim())
    manglerItems.push("[Mangler oplysninger] Arbejdsopgave ikke beskrevet");

  const kritiske = [
    "KRITISKE MANGLER (skal adresseres før godkendelse):",
    ...(calc.criticalGaps.length > 0
      ? calc.criticalGaps.map((g) => `  ${g.priority}: ${g.message}`)
      : ["  Ingen P1/P2-mangler registreret – faglig gennemgang anbefales stadig."]),
    "",
    "KRITISKE ADVARSLER:",
    ...(calc.criticalWarnings.length > 0
      ? calc.criticalWarnings
      : ["  Ingen akutte P1-advarsler."]),
  ].join("\n");

  const forbedringer = calc.recommendedActions
    .map(
      (a) =>
        `${a.priority} – ${a.action}\n   Begrundelse: ${a.rationale}`
    )
    .concat(
      suggestionFlags.map((f) =>
        suggestionLine(`${f.label}. ${f.detail}`)
      )
    )
    .join("\n\n");

  const vaernemidler = [
    "[SDS sektion 8 + arbejdsopgave]",
    sdsLine("sektion 8", `Åndedræt: ${sds.ppe.respiratoryProtection}`),
    sdsLine("sektion 8", `Handsker: ${sds.ppe.handProtection}`),
    sdsLine("sektion 8", `Øjne: ${sds.ppe.eyeProtection}`),
    workLine("Anvendt", work.vaernemidler),
    "",
    "Kobling til risikomotor:",
    ...calc.pathways
      .filter((p) => p.riskResidual === "høj" || p.riskResidual === "kritisk")
      .map(
        (p) =>
          `  ${p.label}: rest-risiko ${p.riskResidual} – ${p.reductionReasons[0] ?? "overvej yderligere tiltag"}`
      ),
  ].join("\n");

  const foerstehjaelp = [
    sdsLine("sektion 4", `Indånding: ${sds.firstAid.inhalation}`),
    sdsLine("sektion 4", `Hud: ${sds.firstAid.skin}`),
    sdsLine("sektion 4", `Øjne: ${sds.firstAid.eyes}`),
  ].join("\n");

  const opbevaringAffald = [
    workLine("Opbevaring arbejdssted", work.opbevaringArbejdssted),
    workLine("Affald/spild", work.affaldSpild),
    sdsLine("sektion 7", sds.storage),
    sdsLine("sektion 13", sds.disposal),
  ].join("\n");

  const substitution =
    hasH(sds.hStatements, ["H340", "H350", "H360"]) > 0
      ? suggestionLine(
          "Substitutionsvurdering påkrævet pga. CMR/kræftfremkaldende H-sætninger."
        )
      : "Substitutionsvurdering: Ingen automatisk pligt – vurder ved ændret anvendelse.";

  const samletRisiko = [
    "FAGLIG SAMLET VURDERING (risikomotor v2):",
    calc.summary,
    "",
    `Datakvalitet: ${calc.dataQualityScore}%`,
    `Vurderingskonfidens: ${calc.assessmentConfidence}`,
    `Usikkerhedsniveau: ${calc.uncertaintyLevel}`,
    "",
    `Risiko FØR kontrol: ${calc.overallBefore.toUpperCase()}`,
    `Risiko EFTER kontrol: ${calc.overallAfter.toUpperCase()}`,
    `REST-RISIKO: ${calc.overallResidual.toUpperCase()}`,
    "",
    "Fare (SDS) og eksponering (arbejde) vurderes separat. PPE og teknik reducerer eksponering.",
    "Endelig klassificering fastsættes ved faglig gennemgang.",
  ].join("\n");

  const medarbejder = [
    `Produkt: ${sds.productName}`,
    `Opgave: ${work.arbejdsopgave || MISSING}`,
    `Samlet rest-risiko: ${calc.overallResidual.toUpperCase()}`,
    calc.criticalWarnings[0] ?? "Følg SDS og lokale procedurer.",
    "Ved tvivl – stop arbejdet og kontakt leder.",
  ].join("\n");

  const godkendelse = [
    "Status: Udkast til faglig gennemgang",
    "IKKE godkendt automatisk.",
    `Beregnet: ${new Date().toLocaleString("da-DK")}`,
  ].join("\n");

  const contents: Record<(typeof RISK_SECTION_KEYS)[number], string> = {
    produkt_sds: produktSds,
    arbejdsopgave,
    farlige_egenskaber: farlige,
    risikomatrix,
    eksponering,
    foranstaltninger,
    mangler: manglerItems.length
      ? manglerItems.join("\n")
      : MISSING,
    kritiske_forhold: kritiske,
    forbedringer,
    vaernemidler,
    foerstehjaelp,
    opbevaring_affald: opbevaringAffald,
    substitution,
    samlet_risiko: samletRisiko,
    medarbejderinstruktion: medarbejder,
    godkendelse,
  };

  return RISK_SECTION_KEYS.map((key) => ({
    key,
    title: SECTION_TITLES[key],
    content: contents[key],
  }));
}

function hasH(h: string[], codes: string[]): number {
  return h.filter((c) =>
    codes.some((code) => c.toUpperCase().startsWith(code.toUpperCase()))
  ).length;
}

export function generateChemicalRiskAssessment(
  sdsData: SdsDataForAssessment,
  workTaskData: WorkTaskData,
  chemicalId: string
): ChemicalRiskAssessment {
  const ruleFlags = evaluateRules(sdsData, workTaskData);
  const riskCalculation = computeExposureRisk(sdsData, workTaskData);
  const sections = buildSections(
    sdsData,
    workTaskData,
    ruleFlags,
    riskCalculation
  );
  const now = new Date().toISOString();

  return {
    id: `ra-${Date.now()}`,
    chemicalId,
    productName:
      sdsData.productName !== SDS_MISSING
        ? sdsData.productName
        : "Mangler oplysninger",
    status: "udkast",
    workTaskData,
    sdsData,
    ruleFlags,
    riskCalculation,
    sections,
    createdAt: now,
    updatedAt: now,
  };
}

export function chemicalToSdsData(chemical: Chemical): SdsDataForAssessment {
  const source =
    chemical.source === "upload"
      ? `Uploadet SDS: ${chemical.uploadedFileName ?? "PDF"}`
      : "Mock-kemikaliedata (begrænset SDS-udtræk)";

  if (chemical.sdsExtracted) {
    return sdsFullToAssessmentData(chemical.sdsExtracted, source);
  }

  return sdsExtractedToAssessmentData(
    chemical.productName,
    chemical.casNumber,
    chemical.hStatements,
    chemical.pStatements ?? [],
    chemical.protectiveEquipment,
    undefined,
    source
  );
}

export { extractSdsData } from "./sds-extract";
