import type { SdsFullData } from "./sds-extract";
import { evaluateRules } from "./rules-engine";
import { EMPTY_WORK_TASK } from "./risk-assessment-types";
import { sdsFullToAssessmentData } from "./risk-assessment-types";

export const SUGGESTION_PREFIX = "Forslag – kræver faglig vurdering";

export interface SystemSuggestion {
  text: string;
  ruleId?: string;
}

export function getSystemSuggestions(sds: SdsFullData): SystemSuggestion[] {
  const assessmentSds = sdsFullToAssessmentData(
    sds,
    sds.sourceSections[0]
      ? `SDS upload (${sds.sourceSections.length} sektioner udtrukket)`
      : "SDS upload"
  );
  const flags = evaluateRules(assessmentSds, EMPTY_WORK_TASK);

  const suggestions: SystemSuggestion[] = flags.map((f) => ({
    text: `${SUGGESTION_PREFIX}: ${f.label}. ${f.detail}`,
    ruleId: f.id,
  }));

  if (sds.missingFields.length > 0) {
    suggestions.push({
      text: `${SUGGESTION_PREFIX}: Suppler manglende SDS-felter (${sds.missingFields.slice(0, 5).join(", ")}${sds.missingFields.length > 5 ? " …" : ""}) før endelig vurdering.`,
    });
  }

  return suggestions;
}
