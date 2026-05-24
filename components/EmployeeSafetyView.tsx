"use client";

import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { LargeSymbolStrip } from "@/components/LargeSymbolStrip";
import { RiskBadge } from "@/components/RiskBadge";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import {
  buildEmployeeSafetyBrief,
  isPublishedForEmployees,
} from "@/lib/employee-safety-brief";
import { useAuth } from "@/context/AuthContext";
import { ppeSymbolPath } from "@/lib/safety-symbols";
import { riskLevelColors } from "@/lib/risk-visual";

interface EmployeeSafetyViewProps {
  chemicalId: string;
}

function Card({
  title,
  borderClass,
  children,
}: {
  title: string;
  borderClass?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${borderClass ?? ""}`}
    >
      <h2 className="mb-3 text-lg font-bold text-work-navy">{title}</h2>
      {children}
    </section>
  );
}

function ShortList({ items, icon }: { items: string[]; icon: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-base leading-snug text-gray-900">
          <span className="mt-0.5 shrink-0 text-xl" aria-hidden>
            {icon}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function EmployeeSafetyView({ chemicalId }: EmployeeSafetyViewProps) {
  const { isAdmin } = useAuth();
  const { hydrated, getChemicalById, getPublishedRiskAssessment } =
    useChemicalStore();
  const chemical = getChemicalById(chemicalId);
  const assessment = getPublishedRiskAssessment(chemicalId);

  if (!hydrated) {
    return <div className="px-4 py-12 text-center text-gray-600">Indlæser…</div>;
  }

  if (!chemical) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-600">Kemikaliet blev ikke fundet.</p>
        <Link href="/medarbejder" className="mt-4 inline-block text-work-blue underline">
          Til medarbejdervisning
        </Link>
      </div>
    );
  }

  if (!isPublishedForEmployees(assessment)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Medarbejderinstruktion" backHref="/medarbejder" />
        <div className="px-4 py-12 text-center">
          <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-8">
            <p className="text-4xl" aria-hidden>
              🔒
            </p>
            <h1 className="mt-3 text-xl font-bold text-amber-950">
              {chemical.productName}
            </h1>
            <p className="mt-4 text-base text-amber-900">
              Ikke frigivet til medarbejdere endnu.
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Kemisk APV skal være publiceret af arbejdsmiljøansvarlig, før
              instruktionen vises her.
            </p>
          </div>
          <Link
            href={`/kemikalie/${chemicalId}`}
            className="mt-6 inline-block text-work-blue underline"
          >
            Tilbage til kemikaliekort
          </Link>
        </div>
      </div>
    );
  }

  const brief = buildEmployeeSafetyBrief(chemical, assessment);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Header
        title="Medarbejderinstruktion"
        backHref="/medarbejder"
        backLabel="Til oversigt"
      />

      <div className="space-y-4 px-4 py-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-work-navy">{brief.productName}</h1>
            <RiskBadge level={brief.riskLevel} size="lg" />
          </div>
          <p className="mt-1 text-sm text-gray-600">{brief.workplace}</p>
          <div
            className={`mt-3 rounded-xl border-2 px-3 py-2 text-center text-sm font-bold ${riskLevelColors(brief.riskLevel)}`}
          >
            Samlet risiko: {String(brief.riskLevel).toUpperCase()}
          </div>
          <div className="mt-4">
            <LargeSymbolStrip ghs={brief.ghs} ppe={[]} />
          </div>
        </section>

        <Card title="Du skal bruge" borderClass="border-l-4 border-l-blue-500">
          {brief.ppe.length > 0 && (
            <div className="mb-4 flex flex-wrap justify-center gap-3">
              {brief.ppe.map((p) => (
                <div key={p.isoCode} className="flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                    <Image
                      src={ppeSymbolPath(p.file)}
                      alt={p.label}
                      width={72}
                      height={72}
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                  <p className="mt-1 text-xs font-bold text-blue-900">{p.isoCode}</p>
                </div>
              ))}
            </div>
          )}
          <ShortList items={brief.ppeLabels} icon="🧤" />
        </Card>

        <Card title="Vær særligt opmærksom på" borderClass="border-l-4 border-l-orange-500">
          <ShortList items={brief.attentions.length ? brief.attentions : brief.topHazards} icon="⚠️" />
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Det skal du gøre" borderClass="border-l-4 border-l-emerald-500">
            <ShortList items={brief.mustDo} icon="✓" />
          </Card>
          <Card title="Det må du ikke" borderClass="border-l-4 border-l-red-400">
            <ShortList items={brief.mustNot} icon="✗" />
          </Card>
        </div>

        <Card title="Ved uheld" borderClass="border-l-4 border-l-amber-500">
          <ShortList items={brief.accidentFirstAid} icon="➕" />
          <p className="mt-3 flex gap-2.5 text-base leading-snug text-gray-900">
            <span className="shrink-0 text-xl" aria-hidden>
              💧
            </span>
            <span>
              <strong>Spild:</strong> {brief.accidentSpill}
            </span>
          </p>
        </Card>

        <section className="rounded-2xl border-2 border-red-600 bg-red-600 p-4 text-white shadow-md">
          <h2 className="mb-3 text-lg font-bold">Stop arbejdet hvis</h2>
          <ul className="space-y-2">
            {brief.stopRules.map((rule) => (
              <li key={rule} className="flex gap-2 text-base font-medium">
                <span aria-hidden>🛑</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <Card title="Kontakt leder / arbejdsmiljøansvarlig">
          <p className="text-base font-semibold text-gray-900">{brief.contactPerson}</p>
          <p className="mt-2 text-sm text-gray-600">{brief.emergencyPhone}</p>
        </Card>

        {brief.sdsIsExternal ? (
          <a
            href={brief.sdsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-work-blue bg-white text-lg font-semibold text-work-navy active:bg-work-sky/50"
          >
            Åbn fuld SDS ↗
          </a>
        ) : (
          <Link
            href={brief.sdsHref}
            className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-work-blue bg-white text-lg font-semibold text-work-navy active:bg-work-sky/50"
          >
            Åbn fuld SDS
          </Link>
        )}

        {isAdmin && (
          <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-100 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Kun admin / arbejdsmiljø (HSE)
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/apv/${chemicalId}`}
                className="flex min-h-12 items-center justify-center rounded-xl border-2 border-gray-400 bg-white font-semibold text-gray-800"
              >
                Vis fuld kemisk APV
              </Link>
              <Link
                href={`/kemikalie/${chemicalId}/risikovurdering?full=1`}
                className="flex min-h-12 items-center justify-center rounded-xl border-2 border-gray-400 bg-white font-semibold text-gray-800"
              >
                Vis fuld risikovurdering
              </Link>
              <Link href="/admin" className="text-center text-sm text-work-blue underline">
                Administration
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
