import type { MatrixRiskLevel } from "./exposure-risk-engine";
import type { RiskAssessmentStatus } from "./risk-assessment-types";
import type { RiskLevel } from "./types";

export type RiskBadgeVariant =
  | MatrixRiskLevel
  | RiskLevel
  | RiskAssessmentStatus
  | "mangler";

export function riskLevelColors(level: RiskBadgeVariant): string {
  switch (level) {
    case "lav":
      return "bg-emerald-500 text-white border-emerald-600";
    case "middel":
      return "bg-yellow-400 text-yellow-950 border-yellow-500";
    case "høj":
      return "bg-orange-500 text-white border-orange-600";
    case "kritisk":
      return "bg-red-600 text-white border-red-700";
    case "mangler":
      return "bg-slate-400 text-white border-slate-500";
    case "udkast":
      return "bg-slate-500 text-white border-slate-600";
    case "klar":
      return "bg-sky-600 text-white border-sky-700";
    case "publiceret":
      return "bg-emerald-700 text-white border-emerald-800";
    default:
      return "bg-slate-400 text-white border-slate-500";
  }
}

export function riskLevelSoftColors(level: RiskBadgeVariant): string {
  switch (level) {
    case "lav":
      return "bg-emerald-100 text-emerald-900 border-emerald-300";
    case "middel":
      return "bg-yellow-100 text-yellow-900 border-yellow-300";
    case "høj":
      return "bg-orange-100 text-orange-900 border-orange-300";
    case "kritisk":
      return "bg-red-100 text-red-900 border-red-300";
    case "mangler":
      return "bg-slate-100 text-slate-700 border-slate-300";
    case "udkast":
      return "bg-slate-100 text-slate-800 border-slate-300";
    case "klar":
      return "bg-sky-100 text-sky-900 border-sky-300";
    case "publiceret":
      return "bg-emerald-100 text-emerald-900 border-emerald-400";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

export function riskBadgeLabel(level: RiskBadgeVariant): string {
  switch (level) {
    case "lav":
      return "Lav risiko";
    case "middel":
      return "Middel risiko";
    case "høj":
      return "Høj risiko";
    case "kritisk":
      return "Kritisk risiko";
    case "mangler":
      return "Mangler oplysninger";
    case "udkast":
      return "Udkast";
    case "klar":
      return "Klar til gennemgang";
    case "publiceret":
      return "Publiceret";
    default:
      return String(level);
  }
}

export const PRIORITY_META = {
  P1: {
    label: "P1",
    title: "Kritisk – skal håndteres før godkendelse",
    className: "bg-red-600 text-white border-red-700",
  },
  P2: {
    label: "P2",
    title: "Vigtigt – bør håndteres snarest",
    className: "bg-orange-500 text-white border-orange-600",
  },
  P3: {
    label: "P3",
    title: "Forbedring – kan håndteres senere",
    className: "bg-yellow-400 text-yellow-950 border-yellow-500",
  },
} as const;

export function pathwayBorderColor(level: MatrixRiskLevel): string {
  switch (level) {
    case "lav":
      return "border-l-emerald-500";
    case "middel":
      return "border-l-yellow-400";
    case "høj":
      return "border-l-orange-500";
    case "kritisk":
      return "border-l-red-600";
  }
}
