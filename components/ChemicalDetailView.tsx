"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { GhsSymbolGrid } from "@/components/GhsSymbolGrid";
import { PpeSymbolGrid } from "@/components/PpeSymbolGrid";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RiskBadge } from "@/components/RiskBadge";
import { SdsInfoPanel } from "@/components/SdsInfoPanel";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { buildSafetyContext } from "@/lib/safety-symbols";

interface ChemicalDetailViewProps {
  id: string;
}

export function ChemicalDetailView({ id }: ChemicalDetailViewProps) {
  const { hydrated, getChemicalById, getPublishedRiskAssessment } =
    useChemicalStore();
  const chemical = getChemicalById(id);
  const publishedRa = getPublishedRiskAssessment(id);
  const sds = chemical?.sdsExtracted;
  const safety = chemical
    ? buildSafetyContext(chemical, publishedRa)
    : null;

  if (!hydrated) {
    return (
      <div className="px-4 py-12 text-center text-gray-600">Indlæser…</div>
    );
  }

  if (!chemical) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-600">Kemikaliet blev ikke fundet.</p>
        <Link href="/soeg" className="mt-4 inline-block text-work-blue underline">
          Gå til søgning
        </Link>
      </div>
    );
  }

  const isUpload = chemical.source === "upload";
  const pStatements = chemical.pStatements ?? [];

  return (
    <div>
      <Header title="Kemikaliekort" backHref="/soeg" backLabel="Til søgning" />
      <div className="space-y-4 px-4 py-4">
        {isUpload && (
          <p className="rounded-lg bg-work-sky/80 px-3 py-2 text-sm text-work-navy">
            Oprettet fra upload: {chemical.uploadedFileName}
          </p>
        )}

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {safety && (
            <div className="mb-4 border-b border-gray-100 pb-4">
              <GhsSymbolGrid symbols={safety.ghs} />
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold text-work-navy">
                {chemical.productName}
              </h2>
              {chemical.casNumber && (
                <p className="text-sm text-gray-500">
                  CAS: {chemical.casNumber}
                </p>
              )}
              <p className="mt-1 text-gray-700">{chemical.location}</p>
            </div>
            {safety && (
              <RiskBadge level={safety.riskLevel} size="md" />
            )}
          </div>

          {safety && safety.criticalGaps.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <span className="text-sm font-semibold text-amber-900">
                Kritiske mangler:
              </span>
              {[...new Set(safety.criticalGaps.map((g) => g.priority))]
                .filter((p) => p === "P1" || p === "P2")
                .map((p) => (
                  <PriorityBadge
                    key={p}
                    priority={p as "P1" | "P2"}
                    showTitle
                  />
                ))}
            </div>
          )}

          {safety && (
            <div className="mb-4 border-b border-gray-100 pb-4">
              <PpeSymbolGrid items={safety.ppe} />
            </div>
          )}

          <section className="mb-4 border-t border-gray-100 pt-4">
            <h3 className="mb-2 font-semibold text-work-navy">H-sætninger</h3>
            {chemical.hStatements.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {chemical.hStatements.map((h) => (
                  <li
                    key={h}
                    className="rounded-lg bg-amber-50 px-3 py-2 font-mono text-sm font-semibold text-amber-900"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Mangler oplysninger
              </p>
            )}
          </section>

          {pStatements.length > 0 && (
            <section className="mb-4 border-t border-gray-100 pt-4">
              <h3 className="mb-2 font-semibold text-work-navy">P-sætninger</h3>
              <ul className="flex flex-wrap gap-2">
                {pStatements.map((p) => (
                  <li
                    key={p}
                    className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="border-t border-gray-100 pt-4">
            <h3 className="mb-2 font-semibold text-work-navy">Risiko</h3>
            <p className="text-gray-800">{chemical.riskDescription}</p>
          </section>
        </article>

        {sds && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <SdsInfoPanel
              sds={sds}
              suggestions={chemical.systemSuggestions}
              compact={false}
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href={`/kemikalie/${chemical.id}/sikkerhed`}
            className="flex min-h-14 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-semibold text-white active:bg-emerald-800"
          >
            Sikkerhedsinstruktion
          </Link>
          <Link
            href={`/kemikalie/${chemical.id}`}
            className="flex min-h-12 items-center justify-center rounded-xl border-2 border-gray-300 bg-gray-50 text-sm font-medium text-gray-700"
          >
            Teknisk kemikaliekort
          </Link>

          {isUpload ? (
            <>
              <Link
                href={`/kemikalie/${chemical.id}/sds`}
                className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-work-blue bg-white text-lg font-semibold text-work-navy active:bg-work-sky/50"
              >
                SDS-tekst
              </Link>
              <Link
                href={`/kemikalie/${chemical.id}/udtruk`}
                className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-gray-300 bg-gray-50 text-lg font-semibold text-gray-800 active:bg-gray-100"
              >
                Udtrukne SDS-oplysninger
              </Link>
            </>
          ) : (
            <a
              href={chemical.sdsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-work-blue bg-white text-lg font-semibold text-work-navy active:bg-work-sky/50"
            >
              Åbn sikkerhedsdatablad (SDS) ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
