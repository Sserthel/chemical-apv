"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { RiskBadge } from "@/components/RiskBadge";
import { chemicalFromAssessment } from "@/lib/chemical-from-assessment";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { buildSafetyContext } from "@/lib/safety-symbols";

export function MedarbejderIndexView({ embedded = false }: { embedded?: boolean }) {
  const { hydrated, syncing, riskAssessments } = useChemicalStore();

  const published = riskAssessments
    .filter((a) => a.status === "publiceret")
    .map((ra) => {
      const chemical = chemicalFromAssessment(ra);
      const safety = buildSafetyContext(chemical, ra);
      return { chemical, ra, riskLevel: safety.riskLevel };
    });

  const uniquePublished = Array.from(
    new Map(published.map((p) => [p.ra.chemicalId, p])).values()
  );

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50 pb-8"}>
      {!embedded && (
        <Header title="Medarbejdervisning" backHref="/" backLabel="Forside" />
      )}
      <div className="space-y-4 px-4 py-4">
        <p className="text-base text-gray-700">
          Korte sikkerhedsinstruktioner til arbejdet – kun publicerede kemiske APV&apos;er.
        </p>

        {!hydrated || syncing ? (
          <p className="text-gray-500">Indlæser…</p>
        ) : uniquePublished.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-gray-600">
              Ingen kemikalier er frigivet til medarbejdere endnu.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Arbejdsmiljøansvarlig skal publicere kemisk APV først.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {uniquePublished.map(({ chemical, riskLevel }) => (
              <li key={chemical.id}>
                <Link
                  href={`/medarbejder/${chemical.id}`}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
                >
                  <div>
                    <p className="text-lg font-bold text-work-navy">
                      {chemical.productName}
                    </p>
                    <p className="text-sm text-gray-600">{chemical.location}</p>
                  </div>
                  <RiskBadge level={riskLevel} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
