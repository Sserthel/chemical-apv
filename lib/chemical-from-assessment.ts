import type { ChemicalRiskAssessment } from "@/lib/risk-assessment-types";
import type { Chemical } from "@/lib/types";
import { SDS_MISSING } from "@/lib/sds-extract";

/** Minimal kemikalie bygget fra publiceret risikovurdering (når kemikaliekort kun findes hos admin). */
export function chemicalFromAssessment(
  assessment: ChemicalRiskAssessment
): Chemical {
  const sds = assessment.sdsData;
  const residual = assessment.riskCalculation?.overallResidual;
  let risk: Chemical["risk"] = "middel";
  if (residual === "lav" || residual === "middel" || residual === "høj") {
    risk = residual;
  } else if (residual === "kritisk") {
    risk = "høj";
  }

  return {
    id: assessment.chemicalId,
    productName: assessment.productName,
    casNumber: sds.casNumbers?.[0],
    location: assessment.workTaskData.afdeling?.trim() || "Arbejdsplads",
    hStatements: sds.hStatements ?? [],
    pStatements: sds.pStatements ?? [],
    protectiveEquipment: [],
    risk,
    riskDescription:
      sds.hStatements?.length > 0
        ? sds.hStatements.join(", ")
        : assessment.productName,
    sdsUrl: sds.sdsSource?.startsWith("http") ? sds.sdsSource : "#",
    source: "mock",
  };
}

export function riskDescriptionFromAssessment(
  assessment: ChemicalRiskAssessment
): string {
  const sds = assessment.sdsData;
  if (sds.hStatements?.length) return sds.hStatements.join(", ");
  const signal = sds.signalWord !== SDS_MISSING ? sds.signalWord : "";
  return signal || assessment.productName;
}
