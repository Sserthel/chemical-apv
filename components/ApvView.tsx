"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { GhsSymbolGrid } from "@/components/GhsSymbolGrid";
import { PpeSymbolGrid } from "@/components/PpeSymbolGrid";
import { RiskBadge } from "@/components/RiskBadge";
import { RiskMatrixPanel } from "@/components/RiskMatrixPanel";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { buildSafetyContext } from "@/lib/safety-symbols";
interface ApvViewProps {
  id: string;
}

export function ApvView({ id }: ApvViewProps) {
  const { hydrated, getChemicalById, getApvByChemicalId, getPublishedRiskAssessment } =
    useChemicalStore();
  const chemical = getChemicalById(id);
  const apv = getApvByChemicalId(id);
  const publishedRa = getPublishedRiskAssessment(id);

  if (!hydrated) {
    return (
      <div className="px-4 py-12 text-center text-gray-600">Indlæser…</div>
    );
  }
  if (!chemical || !apv) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-600">APV blev ikke fundet.</p>
        <Link
          href={`/kemikalie/${id}`}
          className="mt-4 inline-block text-work-blue underline"
        >
          Til kemikaliekort
        </Link>
      </div>
    );
  }

  const isUpload = chemical.source === "upload";
  const safety = buildSafetyContext(chemical, publishedRa);
  const calc = safety.riskCalc;

  return (
    <div>
      <Header
        title="Kemisk APV (HSE)"
        backHref={`/medarbejder/${id}`}
        backLabel="Til medarbejderinstruktion"
      />
      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl bg-work-navy p-5 text-white">
          <p className="text-sm text-work-sky/90">Produkt</p>
          <h2 className="text-xl font-bold">{chemical.productName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm text-work-sky/90">{apv.workplace}</p>
            <RiskBadge level={safety.riskLevel} size="sm" />
          </div>
        </div>

        {calc && <RiskMatrixPanel calculation={calc} />}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <GhsSymbolGrid symbols={safety.ghs} />
          <div className="mt-4 border-t border-gray-100 pt-4">
            <PpeSymbolGrid items={safety.ppe} />
          </div>
        </div>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 font-semibold text-work-navy">Resumé</h3>
          <p className="text-gray-800">{apv.summary}</p>
          <dl className="mt-4 grid gap-2 border-t border-gray-100 pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Vurderet af</dt>
              <dd className="text-right font-medium text-gray-900">
                {apv.assessedBy}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Dato</dt>
              <dd className="font-medium text-gray-900">
                {new Date(apv.assessedDate).toLocaleDateString("da-DK", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </article>

        {apv.sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h3 className="mb-3 font-semibold text-work-navy">
              {section.title}
            </h3>
            <ul className="list-inside list-disc space-y-2 text-gray-800">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="rounded-2xl border-2 border-work-green/30 bg-emerald-50 p-5">
          <h3 className="mb-3 font-semibold text-emerald-900">
            Forholdsregler og tiltag
          </h3>
          <ul className="space-y-2">
            {apv.measures.map((m) => (
              <li
                key={m}
                className="flex gap-2 text-emerald-900 before:content-['✓']"
              >
                {m}
              </li>
            ))}
          </ul>
        </section>

        {isUpload ? (
          <Link
            href={`/kemikalie/${id}/sds`}
            className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-gray-300 bg-white font-semibold text-gray-800 active:bg-gray-50"
          >
            SDS-tekst
          </Link>
        ) : (
          <a
            href={chemical.sdsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-gray-300 bg-white font-semibold text-gray-800 active:bg-gray-50"
          >
            SDS – sikkerhedsdatablad ↗
          </a>
        )}

        <Link
          href={`/kemikalie/${id}`}
          className="block text-center text-sm font-medium text-work-blue underline"
        >
          Tilbage til kemikaliekort
        </Link>
      </div>
    </div>
  );
}
