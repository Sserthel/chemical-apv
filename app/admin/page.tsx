"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { RiskAssessmentGenerator } from "@/components/RiskAssessmentGenerator";
import { SdsOnlineSearch } from "@/components/SdsOnlineSearch";
import { SdsUpload } from "@/components/SdsUpload";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { STATUS_LABELS } from "@/lib/risk-assessment-types";
import { riskLabels } from "@/lib/risk";
import { RoleBadge } from "@/components/RoleBadge";

export default function AdminPage() {
  const { hydrated, allChemicals, uploads, deleteUpload, riskAssessments } =
    useChemicalStore();
  const mockCount = allChemicals.length - uploads.length;

  return (
    <div>
      <Header title="Administration" backHref="/dashboard" />
      <div className="px-4 pt-3">
        <RoleBadge role="admin" />
      </div>
      <div className="space-y-4 px-4 py-4">
        <SdsOnlineSearch />

        <SdsUpload />

        <RiskAssessmentGenerator />

        {riskAssessments.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <h2 className="border-b border-gray-100 px-4 py-3 font-semibold text-work-navy">
              Risikovurderinger
            </h2>
            <ul className="divide-y divide-gray-100">
              {riskAssessments.map((ra) => (
                <li key={ra.id}>
                  <Link
                    href={`/admin/risikovurdering/${ra.id}`}
                    className="flex min-h-14 items-center justify-between gap-2 px-4 py-3 active:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {ra.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ra.workTaskData.arbejdsopgave.slice(0, 50) ||
                          "Ingen arbejdsopgave angivet"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-gray-600">
                      {STATUS_LABELS[ra.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-work-navy">
              {hydrated ? allChemicals.length : "–"}
            </p>
            <p className="text-sm text-gray-600">Kemikalier i alt</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold text-work-navy">
              {hydrated ? uploads.length : "–"}
            </p>
            <p className="text-sm text-gray-600">Uploadede (localStorage)</p>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          {mockCount} mock-kemikalier + {uploads.length} uploadede på denne
          enhed.
        </p>

        {uploads.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <h2 className="border-b border-gray-100 px-4 py-3 font-semibold text-work-navy">
              Uploadede kemikalier
            </h2>
            <ul className="divide-y divide-gray-100">
              {uploads.map((u) => (
                <li key={u.chemical.id} className="flex items-stretch gap-2">
                  <Link
                    href={`/kemikalie/${u.chemical.id}`}
                    className="flex min-h-14 flex-1 flex-col justify-center px-4 py-3 active:bg-gray-50"
                  >
                    <p className="font-medium text-gray-900">
                      {u.chemical.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {u.chemical.uploadedFileName}
                    </p>
                  </Link>
                  <div className="flex flex-col items-end justify-center gap-1 px-3 py-2">
                    <span className="text-xs font-medium text-gray-600">
                      {riskLabels[u.chemical.risk]}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Slet «${u.chemical.productName}» fra denne enhed?`
                          )
                        ) {
                          deleteUpload(u.chemical.id);
                        }
                      }}
                      className="text-xs text-red-600 underline"
                    >
                      Slet
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-100 px-4 py-3 font-semibold text-work-navy">
            Alle kemikalier
          </h2>
          <ul className="divide-y divide-gray-100">
            {(hydrated ? allChemicals : []).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kemikalie/${c.id}`}
                  className="flex min-h-14 items-center justify-between gap-2 px-4 py-3 active:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {c.productName}
                      {c.source === "upload" && (
                        <span className="ml-2 text-xs text-work-blue">
                          (upload)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{c.location}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-gray-600">
                    {riskLabels[c.risk]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
