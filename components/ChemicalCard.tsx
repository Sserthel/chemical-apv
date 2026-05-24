"use client";

import Link from "next/link";
import type { Chemical } from "@/lib/types";
import { GhsSymbolGrid } from "@/components/GhsSymbolGrid";
import { RiskBadge } from "@/components/RiskBadge";
import { useAuth } from "@/context/AuthContext";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { buildSafetyContext } from "@/lib/safety-symbols";

interface ChemicalCardProps {
  chemical: Chemical;
  compact?: boolean;
}

export function ChemicalCard({ chemical, compact = false }: ChemicalCardProps) {
  const { isAdmin } = useAuth();
  const { getPublishedRiskAssessment } = useChemicalStore();
  const isUpload = chemical.source === "upload";
  const pList = chemical.pStatements ?? [];
  const publishedRa = getPublishedRiskAssessment(chemical.id);
  const safety = buildSafetyContext(chemical, publishedRa);
  const hasPublishedInstruction = publishedRa?.status === "publiceret";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {!compact && safety.ghs.length > 0 && (
        <div className="mb-3">
          <GhsSymbolGrid symbols={safety.ghs} title="" />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-work-navy">
            {chemical.productName}
            {isUpload && (
              <span className="ml-2 text-xs font-normal text-work-blue">
                PDF
              </span>
            )}
          </h2>
          {!compact && (
            <p className="text-sm text-gray-600">{chemical.location}</p>
          )}
        </div>
        <RiskBadge level={safety.riskLevel} size="sm" />
      </div>

      {isAdmin && (
        <div className="mb-3 space-y-2 text-sm">
          <div>
            <span className="font-semibold text-gray-700">H-sætninger: </span>
            <span className="text-gray-800">
              {chemical.hStatements.length > 0
                ? chemical.hStatements.join(", ")
                : "Mangler oplysninger – udfyld manuelt"}
            </span>
          </div>
          {!compact && (
            <>
              {pList.length > 0 && (
                <div>
                  <span className="font-semibold text-gray-700">P-sætninger: </span>
                  <span className="text-gray-800">{pList.join(", ")}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-700">Værnemidler: </span>
                {chemical.protectiveEquipment.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc text-gray-800">
                    {chemical.protectiveEquipment.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-amber-800">
                    Mangler oplysninger – udfyld manuelt
                  </span>
                )}
              </div>
              <p className="text-gray-700">
                <span className="font-semibold">Risiko: </span>
                {chemical.riskDescription}
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/medarbejder/${chemical.id}`}
          className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 text-center font-semibold text-white active:bg-emerald-800"
        >
          Åbn medarbejderinstruktion
        </Link>
        {isAdmin && (
          <Link
            href={`/kemikalie/${chemical.id}`}
            className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-work-navy px-4 text-center font-semibold text-white active:bg-work-blue"
          >
            Se kort
          </Link>
        )}
        {hasPublishedInstruction &&
          (isUpload ? (
            isAdmin ? (
              <Link
                href={`/kemikalie/${chemical.id}/sds`}
                className="flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-gray-300 bg-gray-50 px-4 text-center font-semibold text-gray-800 active:bg-gray-100"
              >
                SDS-tekst
              </Link>
            ) : null
          ) : (
            <a
              href={chemical.sdsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-gray-300 bg-gray-50 px-4 text-center font-semibold text-gray-800 active:bg-gray-100"
            >
              SDS ↗
            </a>
          ))}
      </div>
    </article>
  );
}
