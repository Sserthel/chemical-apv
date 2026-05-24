import type { ExposureRiskResult } from "./exposure-risk-engine";
import type { SdsFullData } from "./sds-extract";
import { SDS_MISSING } from "./sds-extract";

export type RiskAssessmentStatus = "udkast" | "klar" | "publiceret";

export type YesNo = "ja" | "nej";

export type ProcessType = "åben" | "lukket";

export interface WorkTaskData {
  arbejdsopgave: string;
  afdeling: string;
  udfoerer: string;
  maengdePrGang: string;
  varighedPrGang: string;
  hyppighed: string;
  procesType: ProcessType;
  sprayAerosol: YesNo;
  opvarmning: YesNo;
  stoefudvikling: YesNo;
  ventilation: string;
  punktudsugning: YesNo;
  vaernemidler: string;
  risikoHudkontakt: string;
  risikoIndaanding: string;
  risikoOejnkontakt: string;
  opbevaringArbejdssted: string;
  affaldSpild: string;
  eksisterendeInstruktion: string;
}

/** SDS-data til risikovurdering = fuldt udtræk + metadata */
export type SdsDataForAssessment = SdsFullData & {
  sdsSource: string;
};

export type RuleFlagId =
  | "cmr_særlig_vurdering"
  | "brandfarligt_antændelseskontrol"
  | "åben_proces_ventilation"
  | "spray_inhalationsrisiko"
  | "opvarmning_dampeksponering"
  | "hudkontakt_handsker"
  | "h314_øjenskyl_ansigtsskærm"
  | "h350_h340_h360_substitution"
  | "h225_h226_brandforebyggelse"
  | "h290_materialekompatibilitet"
  | "manglende_sds_data";

export interface RuleFlag {
  id: RuleFlagId;
  label: string;
  detail: string;
  isSuggestion?: boolean;
}

export interface RiskAssessmentSection {
  key: string;
  title: string;
  content: string;
}

export interface ChemicalRiskAssessment {
  id: string;
  chemicalId: string;
  productName: string;
  status: RiskAssessmentStatus;
  workTaskData: WorkTaskData;
  sdsData: SdsDataForAssessment;
  ruleFlags: RuleFlag[];
  riskCalculation?: ExposureRiskResult;
  sections: RiskAssessmentSection[];
  createdAt: string;
  updatedAt: string;
}

export const RISK_SECTION_KEYS = [
  "produkt_sds",
  "arbejdsopgave",
  "farlige_egenskaber",
  "risikomatrix",
  "eksponering",
  "foranstaltninger",
  "mangler",
  "kritiske_forhold",
  "forbedringer",
  "vaernemidler",
  "foerstehjaelp",
  "opbevaring_affald",
  "substitution",
  "samlet_risiko",
  "medarbejderinstruktion",
  "godkendelse",
] as const;

export const SECTION_TITLES: Record<(typeof RISK_SECTION_KEYS)[number], string> = {
  produkt_sds: "1. Produkt og SDS-grundlag",
  arbejdsopgave: "2. Beskrivelse af arbejdsopgaven",
  farlige_egenskaber: "3. Farlige egenskaber",
  risikomatrix: "4. Risikomatrix og beregning",
  eksponering: "5. Eksponeringsvurdering pr. eksponeringsvej",
  foranstaltninger: "6. Eksisterende foranstaltninger",
  mangler: "7. Mangler i oplysninger",
  kritiske_forhold: "8. Kritiske mangler og advarsler",
  forbedringer: "9. Anbefalede handlinger (prioriteret)",
  vaernemidler: "10. Værnemidler",
  foerstehjaelp: "11. Førstehjælp og beredskab",
  opbevaring_affald: "12. Opbevaring og affald",
  substitution: "13. Substitutionsvurdering",
  samlet_risiko: "14. Samlet risikovurdering (før/efter/rest)",
  medarbejderinstruktion: "15. Kort medarbejderinstruktion",
  godkendelse: "16. Godkendelsesstatus",
};

export const STATUS_LABELS: Record<RiskAssessmentStatus, string> = {
  udkast: "Udkast til faglig gennemgang",
  klar: "Klar til gennemgang",
  publiceret: "Publiceret",
};

export const EMPTY_WORK_TASK: WorkTaskData = {
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
};

export function sdsFullToAssessmentData(
  sds: SdsFullData,
  sdsSource: string
): SdsDataForAssessment {
  return { ...sds, sdsSource };
}

export function sdsExtractedToAssessmentData(
  productName: string,
  casNumber: string | undefined,
  hStatements: string[],
  pStatements: string[],
  protectiveEquipment: string[],
  extracted: SdsFullData | undefined,
  sdsSource: string
): SdsDataForAssessment {
  if (extracted) {
    return sdsFullToAssessmentData(extracted, sdsSource);
  }

  const stub: SdsFullData = {
    productName: productName || SDS_MISSING,
    supplier: SDS_MISSING,
    sdsDate: SDS_MISSING,
    signalWord: SDS_MISSING,
    hazardPictograms: [],
    hStatements,
    pStatements,
    ingredients: [],
    casNumbers: casNumber ? [casNumber] : [],
    exposureLimits: [],
    ppe: {
      respiratoryProtection: SDS_MISSING,
      handProtection: SDS_MISSING,
      eyeProtection: SDS_MISSING,
      skinProtection: SDS_MISSING,
      ventilation: SDS_MISSING,
    },
    firstAid: {
      inhalation: SDS_MISSING,
      skin: SDS_MISSING,
      eyes: SDS_MISSING,
      ingestion: SDS_MISSING,
    },
    fireFighting: {
      suitableExtinguishingMedia: SDS_MISSING,
      specialHazards: SDS_MISSING,
      protectiveEquipment: SDS_MISSING,
    },
    spillResponse: SDS_MISSING,
    handling: SDS_MISSING,
    storage: SDS_MISSING,
    incompatibleMaterials: SDS_MISSING,
    disposal: SDS_MISSING,
    environmentalPrecautions: SDS_MISSING,
    regulatoryInfo: SDS_MISSING,
    missingFields: ["fuld SDS-udtræk"],
    sourceSections: [],
  };

  if (protectiveEquipment.length > 0) {
    stub.ppe.handProtection = protectiveEquipment.join("; ");
  }

  return sdsFullToAssessmentData(stub, sdsSource);
}
