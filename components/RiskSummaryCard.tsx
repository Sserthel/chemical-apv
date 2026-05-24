import type { ExposureRiskResult } from "@/lib/exposure-risk-engine";
import { RiskBadge } from "@/components/RiskBadge";
import { riskLevelColors } from "@/lib/risk-visual";

interface RiskSummaryCardProps {
  calculation: ExposureRiskResult;
  title?: string;
}

export function RiskSummaryCard({
  calculation,
  title = "Risikoresumé",
}: RiskSummaryCardProps) {
  const calc = calculation;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 font-semibold text-work-navy">{title}</h3>

      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          label="Før kontrol"
          level={calc.overallBefore}
        />
        <MetricCard
          label="Efter kontrol"
          level={calc.overallAfter}
        />
        <MetricCard
          label="Rest-risiko"
          level={calc.overallResidual}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <p className="text-xs text-gray-600">Datakvalitet</p>
          <p className="text-lg font-bold text-work-navy">
            {calc.dataQualityScore}%
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <p className="text-xs text-gray-600">Konfidens</p>
          <p className="text-lg font-bold capitalize text-work-navy">
            {calc.assessmentConfidence}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <p className="text-xs text-gray-600">Usikkerhed</p>
          <p className="text-lg font-bold capitalize text-work-navy">
            {calc.uncertaintyLevel}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RiskBadge level={calc.overallResidual} size="md" />
        {calc.dataQualityScore < 50 && (
          <RiskBadge level="mangler" size="sm" />
        )}
      </div>
    </section>
  );
}

function MetricCard({
  label,
  level,
}: {
  label: string;
  level: ExposureRiskResult["overallBefore"];
}) {
  return (
    <div
      className={`rounded-xl border-2 p-3 text-center ${riskLevelColors(level)}`}
    >
      <p className="text-xs font-medium opacity-90">{label}</p>
      <p className="text-lg font-bold uppercase">{level}</p>
    </div>
  );
}
