"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { GhsSymbolGrid } from "@/components/GhsSymbolGrid";
import { PpeSymbolGrid } from "@/components/PpeSymbolGrid";
import { RiskBadge } from "@/components/RiskBadge";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { RiskMatrixPanel } from "@/components/RiskMatrixPanel";
import { type ChemicalRiskAssessment } from "@/lib/risk-assessment-types";
import { buildSafetyContext } from "@/lib/safety-symbols";

interface RiskAssessmentEditorProps {
  id: string;
}

export function RiskAssessmentEditor({ id }: RiskAssessmentEditorProps) {
  const {
    hydrated,
    getRiskAssessmentById,
    getChemicalById,
    saveRiskAssessment,
    deleteRiskAssessmentById,
  } = useChemicalStore();

  const [draft, setDraft] = useState<ChemicalRiskAssessment | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hydrated) {
      setDraft(getRiskAssessmentById(id) ?? null);
    }
  }, [hydrated, id, getRiskAssessmentById]);

  if (!hydrated) {
    return <div className="px-4 py-12 text-center text-gray-600">Indlæser…</div>;
  }

  if (!draft) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-600">Risikovurdering ikke fundet.</p>
        <Link href="/admin" className="mt-4 inline-block text-work-blue underline">
          Til administration
        </Link>
      </div>
    );
  }

  function updateSection(key: string, content: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) =>
          s.key === key ? { ...s, content } : s
        ),
      };
    });
    setSaved(false);
  }

  function handleSave() {
    if (!draft) return;
    saveRiskAssessment(draft);
    setSaved(true);
  }

  const chemical = draft ? getChemicalById(draft.chemicalId) : undefined;
  const safety =
    chemical && draft ? buildSafetyContext(chemical, draft) : null;

  return (
    <div>
      <Header title="Rediger risikovurdering" backHref="/admin" />
      <div className="space-y-4 px-4 py-4">
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={draft.status} size="sm" />
            {safety && <RiskBadge level={safety.riskLevel} size="sm" />}
          </div>
          <p className="mt-1">{draft.productName}</p>
        </div>

        {draft.riskCalculation && (
          <RiskMatrixPanel calculation={draft.riskCalculation} />
        )}

        {safety && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <GhsSymbolGrid symbols={safety.ghs} />
            <div className="mt-4 border-t border-gray-100 pt-4">
              <PpeSymbolGrid items={safety.ppe} />
            </div>
          </div>
        )}

        {draft.ruleFlags.length > 0 && (
          <details className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <summary className="cursor-pointer font-semibold text-work-navy">
              Regeltriggers ({draft.ruleFlags.length})
            </summary>
            <ul className="mt-2 space-y-2 text-gray-700">
              {draft.ruleFlags.map((f) => (
                <li key={f.id}>
                  <strong>{f.label}</strong>
                  <br />
                  {f.detail}
                </li>
              ))}
            </ul>
          </details>
        )}

        {draft.sections.map((section) => (
          <div
            key={section.key}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <label
              htmlFor={section.key}
              className="mb-2 block font-semibold text-work-navy"
            >
              {section.title}
            </label>
            <textarea
              id={section.key}
              rows={section.key === "godkendelse" ? 4 : 6}
              className="w-full rounded-lg border border-gray-200 p-3 text-sm leading-relaxed"
              value={section.content}
              onChange={(e) => updateSection(section.key, e.target.value)}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={handleSave}
          className="flex min-h-14 w-full items-center justify-center rounded-xl bg-work-navy font-semibold text-white"
        >
          Gem ændringer
        </button>
        {saved && (
          <p className="text-center text-sm text-emerald-700">Gemt.</p>
        )}

        <div className="flex flex-col gap-2 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => {
              const next = { ...draft, status: "klar" as const };
              saveRiskAssessment(next);
              setDraft(next);
              setSaved(true);
            }}
            className="min-h-12 rounded-xl border-2 border-work-blue font-semibold text-work-navy"
          >
            Markér som «Klar til gennemgang»
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Publicer? Medarbejdere kan herefter se denne risikovurdering. Evt. tidligere publiceret version for samme produkt sættes til «Klar til gennemgang»."
                )
              ) {
                const next = { ...draft, status: "publiceret" as const };
                saveRiskAssessment(next);
                setDraft(next);
                setSaved(true);
              }
            }}
            className="min-h-12 rounded-xl bg-emerald-700 font-semibold text-white"
          >
            Markér som «Publiceret»
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Slet denne risikovurdering?")) {
                deleteRiskAssessmentById(draft.id);
                window.location.href = "/admin";
              }
            }}
            className="text-sm text-red-600 underline"
          >
            Slet risikovurdering
          </button>
        </div>

        <Link
          href={`/kemikalie/${draft.chemicalId}`}
          className="block text-center text-sm text-work-blue underline"
        >
          Til kemikaliekort
        </Link>
      </div>
    </div>
  );
}
