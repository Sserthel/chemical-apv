"use client";

import { useState } from "react";
import Link from "next/link";
import { WorkTaskForm } from "@/components/WorkTaskForm";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import {
  chemicalToSdsData,
  generateChemicalRiskAssessment,
} from "@/lib/generate-risk-assessment";
import { EMPTY_WORK_TASK } from "@/lib/risk-assessment-types";

export function RiskAssessmentGenerator() {
  const { hydrated, allChemicals, saveRiskAssessment } = useChemicalStore();
  const [chemicalId, setChemicalId] = useState("");
  const [workTask, setWorkTask] = useState(EMPTY_WORK_TASK);
  const [lastId, setLastId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleGenerate() {
    setError("");
    if (!chemicalId) {
      setError("Vælg et kemikalie.");
      return;
    }
    const chemical = allChemicals.find((c) => c.id === chemicalId);
    if (!chemical) {
      setError("Kemikaliet blev ikke fundet.");
      return;
    }

    const sdsData = chemicalToSdsData(chemical);
    const assessment = generateChemicalRiskAssessment(
      sdsData,
      workTask,
      chemicalId
    );
    saveRiskAssessment(assessment);
    setLastId(assessment.id);
  }

  return (
    <section className="rounded-2xl border border-work-blue/30 bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-semibold text-work-navy">
        Kemisk risikovurdering
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Udfyld arbejdsopgaven. Rapporten genereres ud fra SDS-data, dine
        oplysninger og interne regler – uden AI-gæt.
      </p>

      <div className="mb-4">
        <label
          htmlFor="chem-select"
          className="mb-1 block text-sm font-semibold text-work-navy"
        >
          Vælg kemikalie (SDS-grundlag)
        </label>
        <select
          id="chem-select"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base"
          value={chemicalId}
          onChange={(e) => setChemicalId(e.target.value)}
          disabled={!hydrated}
        >
          <option value="">— Vælg produkt —</option>
          {allChemicals.map((c) => (
            <option key={c.id} value={c.id}>
              {c.productName}
              {c.source === "upload" ? " (upload)" : ""}
            </option>
          ))}
        </select>
      </div>

      <WorkTaskForm value={workTask} onChange={setWorkTask} />

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleGenerate}
        className="mt-4 flex min-h-14 w-full items-center justify-center rounded-xl bg-work-navy font-semibold text-white active:bg-work-blue"
      >
        Generer kemisk risikovurdering
      </button>

      {lastId && (
        <Link
          href={`/admin/risikovurdering/${lastId}`}
          className="mt-3 flex min-h-12 items-center justify-center rounded-xl border-2 border-work-blue bg-work-sky font-semibold text-work-navy"
        >
          Åbn og rediger udkast
        </Link>
      )}
    </section>
  );
}
