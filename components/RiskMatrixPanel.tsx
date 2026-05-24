"use client";

import type {
  ExposureRiskResult,
  MatrixRiskLevel,
} from "@/lib/exposure-risk-engine";
import { levelColor } from "@/lib/exposure-risk-engine";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RiskSummaryCard } from "@/components/RiskSummaryCard";
import { pathwayBorderColor } from "@/lib/risk-visual";

interface RiskMatrixPanelProps {
  calculation: ExposureRiskResult;
  compact?: boolean;
}

export function RiskMatrixPanel({
  calculation,
  compact = false,
}: RiskMatrixPanelProps) {
  const calc = calculation;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge label="Før" level={calc.overallBefore} />
        <Badge label="Efter" level={calc.overallAfter} />
        <Badge label="Rest" level={calc.overallResidual} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RiskSummaryCard calculation={calc} />

      <p className="text-xs text-gray-600">
        Fare (SDS) skilles fra eksponering (arbejde). Kontrolforanstaltninger
        reducerer eksponering og sandsynlighed – ikke produktets intrinsic fare.
      </p>

      {calc.criticalWarnings.length > 0 && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3">
          <p className="mb-2 text-sm font-bold text-red-900">
            Kritiske advarsler
          </p>
          <ul className="space-y-1 text-sm text-red-800">
            {calc.criticalWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="bg-work-navy text-white">
            <tr>
              <th className="p-2">Veje</th>
              <th className="p-2">Fare</th>
              <th className="p-2">Eks. før→efter</th>
              <th className="p-2">Før</th>
              <th className="p-2">Rest</th>
            </tr>
          </thead>
          <tbody>
            {calc.pathways.map((p) => (
              <tr
                key={p.pathway}
                className={`border-t border-gray-100 border-l-4 ${pathwayBorderColor(p.riskResidual)}`}
              >
                <td className="p-2 font-medium">{p.label}</td>
                <td className="p-2">
                  <LevelPill level={p.hazardLabel} />
                </td>
                <td className="p-2 text-xs">
                  {p.exposureBefore}→{p.exposureAfter}
                </td>
                <td className="p-2">
                  <LevelPill level={p.riskBefore} />
                </td>
                <td className="p-2">
                  <LevelPill level={p.riskResidual} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {calc.controlSummary.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          <p className="mb-2 text-sm font-bold text-emerald-900">
            Hvorfor risiko blev reduceret
          </p>
          <ul className="space-y-1 text-sm text-emerald-900">
            {calc.controlSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {calc.pathways.map((p) => (
          <details
            key={p.pathway}
            className={`rounded-lg border border-gray-200 bg-gray-50 p-3 border-l-4 ${pathwayBorderColor(p.riskResidual)}`}
          >
            <summary className="cursor-pointer font-semibold text-work-navy">
              {p.label}: fare {p.hazard}/4 · {p.riskBefore} → rest{" "}
              {p.riskResidual}
            </summary>
            <p className="mt-2 text-sm text-gray-700">{p.justification}</p>
            {p.reductionReasons.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-emerald-800">
                {p.reductionReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>

      {calc.criticalGaps.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="mb-2 font-semibold text-amber-900">Kritiske mangler</p>
          <ul className="space-y-1 text-sm">
            {calc.criticalGaps.map((g) => (
              <li key={g.message} className="flex flex-wrap items-start gap-2">
                <PriorityBadge priority={g.priority as "P1" | "P2" | "P3"} />
                <span>{g.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {calc.recommendedActions.length > 0 && (
        <div className="rounded-xl border border-work-blue/30 bg-work-sky/40 p-3">
          <p className="mb-2 font-semibold text-work-navy">
            Prioriterede tiltag
          </p>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            {calc.recommendedActions.map((a) => (
              <li key={a.action} className="flex flex-wrap items-start gap-2">
                <PriorityBadge priority={a.priority as "P1" | "P2" | "P3"} />
                <span>{a.action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function LevelPill({ level }: { level: MatrixRiskLevel }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${levelColor(level)}`}
    >
      {level}
    </span>
  );
}

function Badge({ label, level }: { label: string; level: MatrixRiskLevel }) {
  return (
    <span
      className={`rounded-lg border px-2 py-1 text-xs font-semibold ${levelColor(level)}`}
    >
      {label}: {level}
    </span>
  );
}
