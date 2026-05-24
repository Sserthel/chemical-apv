export type RiskLevel = "lav" | "middel" | "høj";

export type ChemicalSource = "mock" | "upload";

export type { SdsFullData } from "./sds-extract";

import type { SdsFullData } from "./sds-extract";
import type { SystemSuggestion } from "./sds-suggestions";

/** Fuld SDS-udtræk (alias) */
export type SdsExtracted = SdsFullData;

export interface Chemical {
  id: string;
  productName: string;
  casNumber?: string;
  location: string;
  hStatements: string[];
  pStatements?: string[];
  protectiveEquipment: string[];
  risk: RiskLevel;
  riskDescription: string;
  sdsUrl: string;
  source?: ChemicalSource;
  sdsFullText?: string;
  sdsExtracted?: SdsFullData;
  systemSuggestions?: SystemSuggestion[];
  uploadedFileName?: string;
  uploadedAt?: string;
  onlineSdsUrl?: string;
  onlineSdsSource?: "upload" | "online-search";
}

export interface ApvSection {
  title: string;
  items: string[];
}

export interface ChemicalApv {
  chemicalId: string;
  workplace: string;
  assessedBy: string;
  assessedDate: string;
  summary: string;
  sections: ApvSection[];
  measures: string[];
}

export interface StoredUpload {
  chemical: Chemical;
  apv: ChemicalApv;
}
