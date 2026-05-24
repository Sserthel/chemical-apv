import type { RiskLevel } from "./types";

export const riskLabels: Record<RiskLevel, string> = {
  lav: "Lav risiko",
  middel: "Middel risiko",
  høj: "Høj risiko",
};

export function riskBadgeClass(risk: RiskLevel): string {
  switch (risk) {
    case "lav":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "middel":
      return "bg-yellow-100 text-yellow-900 border-yellow-200";
    case "høj":
      return "bg-orange-100 text-orange-900 border-orange-200";
  }
}
