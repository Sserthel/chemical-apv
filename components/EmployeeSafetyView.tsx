"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { LargeSymbolStrip } from "@/components/LargeSymbolStrip";
import { RiskBadge } from "@/components/RiskBadge";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { buildEmployeeSafetyBrief } from "@/lib/employee-safety-brief";
import { useHseAccess } from "@/lib/hse-access";
import { riskLevelColors } from "@/lib/risk-visual";

interface EmployeeSafetyViewProps {
  chemicalId: string;
}

function BulletList({ items, icon }: { items: string[]; icon: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-base leading-snug text-gray-900">
          <span className="shrink-0 text-lg" aria-hidden>
            {icon}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function EmployeeSafetyView({ chemicalId }: EmployeeSafetyViewProps) {
  const hse = useHseAccess();
  const { hydrated, getChemicalById, getPublishedRiskAssessment, getApvByChemicalId } =
    useChemicalStore();
  const chemical = getChemicalById(chemicalId);
  const assessment = getPublishedRiskAssessment(chemicalId);
  const apv = getApvByChemicalId(chemicalId);

  if (!hydrated) {
    return <div className="px-4 py-12 text-center text-gray-600">Indlæser…</div>;
  }

  if (!chemical) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-600">Kemikaliet blev ikke fundet.</p>
        <Link href="/soeg" className="mt-4 inline-block text-work-blue underline">
          Til søgning
        </Link>
      </div>
    );
  }

  const brief = buildEmployeeSafetyBrief(chemical, assessment, apv);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Header
        title="Sikkerhedsinstruktion"
        backHref={`/kemikalie/${chemicalId}`}
        backLabel="Til kort"
      />

      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border-2 border-red-600 bg-red-600 px-4 py-4 text-center text-white shadow-md">
          <p className="text-lg font-black uppercase tracking-wide">Stop</p>
          <p className="mt-1 text-base font-semibold">
            Kontakt leder ved tvivl – fortsæt ikke uden klarhed
          </p>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-work-navy">{brief.productName}</h1>
              <p className="mt-1 text-sm text-gray-600">{brief.workplace}</p>
            </div>
            <RiskBadge level={brief.riskLevel} size="lg" />
          </div>
          <div
            className={`mt-3 rounded-xl border-2 px-3 py-2 text-center text-sm font-semibold ${riskLevelColors(brief.riskLevel)}`}
          >
            Samlet risiko: {String(brief.riskLevel).toUpperCase()}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <LargeSymbolStrip ghs={brief.ghs} ppe={brief.ppe} />
        </section>

        <section className="rounded-2xl border-l-4 border-l-orange-500 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-work-navy">Vigtigste farer</h2>
          <BulletList items={brief.keyHazards} icon="⚠️" />
          {brief.keyHazards.length === 0 && (
            <p className="text-sm text-gray-600">{brief.instruction}</p>
          )}
        </section>

        <section className="rounded-2xl border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-work-navy">Vigtigste regler</h2>
          <BulletList items={brief.keyRules} icon="✓" />
        </section>

        <section className="rounded-2xl bg-work-navy p-4 text-white shadow-sm">
          <h2 className="mb-2 text-lg font-bold">Sådan arbejder du sikkert</h2>
          <p className="text-base leading-relaxed">{brief.instruction}</p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-base font-bold text-work-navy">Førstehjælp</h2>
            <BulletList items={brief.firstAid} icon="➕" />
          </section>
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-base font-bold text-work-navy">Ved spild</h2>
            <p className="text-base leading-snug text-gray-900">{brief.spill}</p>
          </section>
        </div>

        <section className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
          <h2 className="mb-2 text-base font-bold text-amber-950">Nød og kontakt</h2>
          <p className="text-lg font-bold text-amber-950">{brief.emergencyContact}</p>
          <p className="mt-2 text-base text-amber-900">
            Kontaktperson: <strong>{brief.contactPerson}</strong>
          </p>
        </section>

        {hse && (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-100 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Kun for admin / arbejdsmiljø (HSE)
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/apv/${chemicalId}`}
                className="flex min-h-12 items-center justify-center rounded-xl border-2 border-gray-400 bg-white font-semibold text-gray-800"
              >
                Vis detaljeret APV
              </Link>
              {assessment && (
                <Link
                  href={`/kemikalie/${chemicalId}/risikovurdering?full=1`}
                  className="flex min-h-12 items-center justify-center rounded-xl border-2 border-gray-400 bg-white font-semibold text-gray-800"
                >
                  Vis fuld kemisk risikovurdering
                </Link>
              )}
              <Link
                href="/admin"
                className="text-center text-sm text-work-blue underline"
              >
                Administration
              </Link>
            </div>
          </section>
        )}

        {!brief.hasPublishedAssessment && (
          <p className="text-center text-xs text-gray-500">
            Baseret på kemikaliekort og APV. Fuld risikovurdering afventer publicering.
          </p>
        )}
      </div>
    </div>
  );
}
