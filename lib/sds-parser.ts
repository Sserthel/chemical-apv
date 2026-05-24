import {
  extractSdsData,
  hasMissingSdsFields,
  type SdsFullData,
} from "./sds-extract";

/** @deprecated Brug extractSdsData – beholdes for bagudkompatibilitet */
export type SdsExtracted = SdsFullData;

export function parseSdsText(text: string): SdsFullData {
  return extractSdsData(text);
}

export { extractSdsData, hasMissingSdsFields };

export function hasMissingExtractedFields(data: SdsFullData): boolean {
  return hasMissingSdsFields(data);
}
