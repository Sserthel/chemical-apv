"use client";

import { useState } from "react";
import Link from "next/link";
import { SdsDataEditor } from "@/components/SdsDataEditor";
import { WorkTaskForm } from "@/components/WorkTaskForm";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { createUploadFromSdsData } from "@/lib/build-from-sds";
import {
  chemicalToSdsData,
  generateChemicalRiskAssessment,
} from "@/lib/generate-risk-assessment";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { extractSdsData } from "@/lib/sds-extract";
import { EMPTY_WORK_TASK } from "@/lib/risk-assessment-types";
import {
  EMPTY_SDS_VALIDATION,
  SDS_ONLINE_DISCLAIMER,
  type SdsOnlineValidation,
  type SdsSearchResponse,
  type SdsSearchResult,
  type ValidationAnswer,
} from "@/lib/sds-search-types";
import type { SdsFullData } from "@/lib/sds-extract";

type Step =
  | "search"
  | "results"
  | "validate"
  | "extract"
  | "edit"
  | "worktask"
  | "done";

export function SdsOnlineSearch() {
  const { addFromSds, saveRiskAssessment } = useChemicalStore();

  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResponse, setSearchResponse] = useState<SdsSearchResponse | null>(
    null
  );
  const [selected, setSelected] = useState<SdsSearchResult | null>(null);
  const [validation, setValidation] =
    useState<SdsOnlineValidation>(EMPTY_SDS_VALIDATION);
  const [fetchError, setFetchError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [sdsDraft, setSdsDraft] = useState<SdsFullData | null>(null);
  const [fullText, setFullText] = useState("");
  const [fileName, setFileName] = useState("");
  const [savedChemicalId, setSavedChemicalId] = useState<string | null>(null);
  const [workTask, setWorkTask] = useState(EMPTY_WORK_TASK);
  const [riskAssessmentId, setRiskAssessmentId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchError("");
    setSearching(true);
    setSelected(null);
    setSearchResponse(null);

    try {
      const res = await fetch("/api/search-sds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Søgning fejlede.");
        return;
      }
      setSearchResponse(data as SdsSearchResponse);
      setStep("results");
    } catch {
      setSearchError("Netværksfejl ved søgning.");
    } finally {
      setSearching(false);
    }
  }

  function selectResult(result: SdsSearchResult) {
    setSelected(result);
    setValidation(EMPTY_SDS_VALIDATION);
    setStep("validate");
  }

  function validationComplete(): boolean {
    if (!validation.bekraeftet) return false;
    const required: ValidationAnswer[] = [
      validation.leverandoerKorrekt,
      validation.produktnavnKorrekt,
      validation.koncentrationKorrekt,
      validation.sprogKorrekt,
      validation.versionNyNok,
      validation.godkendtTilBrug,
    ];
    return required.every((v) => v === "ja" || v === "nej" || v === "ukendt");
  }

  async function processPdfFile(file: File) {
    setFetchError("");
    setExtracting(true);
    setStep("extract");

    try {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setFetchError("Vælg en PDF-fil.");
        setStep("validate");
        return;
      }

      const text = await extractTextFromPdf(file);
      if (!text.trim()) {
        setFetchError(
          "PDF uden læsbar tekst. Prøv en anden fil eller en tekstbaseret SDS."
        );
        setStep("validate");
        return;
      }

      const extracted = extractSdsData(text);
      setSdsDraft(extracted);
      setFullText(text);
      setFileName(file.name);
      setStep("edit");
    } catch {
      setFetchError("Kunne ikke læse PDF-filen.");
      setStep("validate");
    } finally {
      setExtracting(false);
    }
  }

  async function handleFetchAndExtract() {
    if (!selected) return;

    if (selected.isMock || selected.autoFetchSupported === false) {
      setFetchError(
        "Dette resultat kan ikke hentes automatisk. Brug «Upload PDF» efter du har downloadet SDS fra leverandøren."
      );
      return;
    }

    setFetchError("");
    setExtracting(true);
    setStep("extract");

    try {
      const res = await fetch("/api/fetch-sds-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: selected.link }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFetchError(
          data.error ??
            "Automatisk hentning fejlede. Download PDF fra linket og brug «Upload PDF» nedenfor."
        );
        setStep("validate");
        return;
      }

      if (!data.isPdf) {
        setFetchError(
          "Dokumentet ser ikke ud til at være PDF. Download PDF manuelt og upload nedenfor."
        );
        setStep("validate");
        return;
      }

      const binary = atob(data.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const file = new File([blob], data.fileName, { type: "application/pdf" });
      await processPdfFile(file);
    } catch {
      setFetchError(
        "Hentning fejlede. Download PDF i browseren og upload den manuelt."
      );
      setStep("validate");
    } finally {
      setExtracting(false);
    }
  }

  function handleSaveChemical() {
    if (!sdsDraft || !selected) return;
    const record = createUploadFromSdsData(
      fileName || `${query}-online-sds.pdf`,
      fullText,
      sdsDraft,
      { sourceUrl: selected.link, onlineSearch: true }
    );
    addFromSds(record);
    setSavedChemicalId(record.chemical.id);
    setStep("worktask");
  }

  function handleGenerateRiskAssessment() {
    if (!savedChemicalId || !sdsDraft) return;
    const sdsData = chemicalToSdsData({
      id: savedChemicalId,
      productName: sdsDraft.productName,
      casNumber: sdsDraft.casNumbers[0],
      location: "Online SDS",
      hStatements: sdsDraft.hStatements,
      pStatements: sdsDraft.pStatements,
      protectiveEquipment: [],
      risk: "middel",
      riskDescription: "",
      sdsUrl: "",
      sdsExtracted: sdsDraft,
      source: "upload",
    });
    const assessment = generateChemicalRiskAssessment(
      sdsData,
      workTask,
      savedChemicalId
    );
    saveRiskAssessment(assessment);
    setRiskAssessmentId(assessment.id);
    setStep("done");
  }

  return (
    <section className="rounded-2xl border-2 border-work-blue/30 bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-semibold text-work-navy">
        Online SDS-søgning
      </h2>
      <p className="mb-3 text-sm text-amber-900">{SDS_ONLINE_DISCLAIMER}</p>

      {searchResponse?.mode === "mock" && (
        <div className="mb-3 space-y-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p>
            <strong>Demo-tilstand:</strong> Resultaterne er Google-søgelinks –
            ikke direkte PDF&apos;er. Automatisk hentning virker derfor ikke
            (404).
          </p>
          <p>
            1) Åbn søgelinket · 2) Download SDS-PDF hos leverandør · 3) Upload
            PDF manuelt i trin 3.
          </p>
          <p>
            For rigtige PDF-links: sæt GOOGLE_SEARCH_API_KEY og
            GOOGLE_SEARCH_ENGINE_ID i .env.local
          </p>
        </div>
      )}

      {step === "search" && (
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-sm font-semibold text-work-navy">
            Kemikalie / produktnavn
          </label>
          <input
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="fx Acetone, saltsyre 10%"
            required
            minLength={2}
          />
          {searchError && (
            <p className="text-sm text-red-700">{searchError}</p>
          )}
          <button
            type="submit"
            disabled={searching}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-work-navy font-semibold text-white disabled:opacity-60"
          >
            {searching ? "Søger…" : "Søg efter sikkerhedsdatablade"}
          </button>
        </form>
      )}

      {step === "results" && searchResponse && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {searchResponse.results.length} resultater. Vælg det SDS-dokument
            der matcher dit produkt – systemet vælger aldrig automatisk.
          </p>
          <ul className="space-y-3">
            {searchResponse.results.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <p className="font-semibold text-gray-900">{r.title}</p>
                <p className="text-xs text-gray-500">{r.domain}</p>
                <p className="mt-1 text-sm text-gray-700">{r.snippet}</p>
                {r.isMock && (
                  <p className="mt-2 text-xs font-semibold text-amber-800">
                    Eksempel – brug link til at finde SDS, upload PDF manuelt
                  </p>
                )}
                {!r.isPdf && !r.isMock && (
                  <p className="mt-2 text-xs font-semibold text-amber-800">
                    ⚠ Ikke tydelig PDF – download og upload manuelt
                  </p>
                )}
                <a
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-sm text-work-blue underline"
                >
                  Åbn link
                </a>
                <button
                  type="button"
                  onClick={() => selectResult(r)}
                  className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border-2 border-work-navy font-semibold text-work-navy"
                >
                  Vælg dette resultat
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setStep("search")}
            className="text-sm text-gray-600 underline"
          >
            Ny søgning
          </button>
        </div>
      )}

      {step === "validate" && selected && (
        <div className="space-y-4">
          <div className="rounded-lg bg-work-sky/50 p-3 text-sm">
            <strong>Valgt:</strong> {selected.title}
            <br />
            <span className="text-xs">{selected.link}</span>
          </div>

          <ValidationField
            label="Er leverandøren korrekt?"
            value={validation.leverandoerKorrekt}
            onChange={(v) =>
              setValidation({ ...validation, leverandoerKorrekt: v })
            }
          />
          <ValidationField
            label="Er produktnavnet korrekt?"
            value={validation.produktnavnKorrekt}
            onChange={(v) =>
              setValidation({ ...validation, produktnavnKorrekt: v })
            }
          />
          <ValidationField
            label="Er koncentrationen korrekt?"
            value={validation.koncentrationKorrekt}
            onChange={(v) =>
              setValidation({ ...validation, koncentrationKorrekt: v })
            }
          />
          <ValidationField
            label="Er SDS på dansk eller relevant sprog?"
            value={validation.sprogKorrekt}
            onChange={(v) => setValidation({ ...validation, sprogKorrekt: v })}
          />
          <ValidationField
            label="Er SDS-versionen ny nok?"
            value={validation.versionNyNok}
            onChange={(v) => setValidation({ ...validation, versionNyNok: v })}
          />
          <ValidationField
            label="Er dokumentet godkendt til brug?"
            value={validation.godkendtTilBrug}
            onChange={(v) =>
              setValidation({ ...validation, godkendtTilBrug: v })
            }
          />

          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              checked={validation.bekraeftet}
              onChange={(e) =>
                setValidation({ ...validation, bekraeftet: e.target.checked })
              }
              className="mt-1 h-5 w-5"
            />
            <span>
              Jeg bekræfter, at jeg har verificeret SDS mod leverandør,
              produkt, koncentration og version, og at jeg selv har valgt dette
              dokument.
            </span>
          </label>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-2 text-sm font-semibold text-emerald-900">
              Anbefalet: Upload PDF manuelt
            </p>
            <ol className="mb-3 list-inside list-decimal text-xs text-emerald-900">
              <li>Åbn linket og download den korrekte SDS-PDF</li>
              <li>Upload PDF her – systemet udtrækker data</li>
            </ol>
            <label
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-emerald-700 font-semibold text-white ${
                !validationComplete() ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Upload PDF og udtræk SDS-data
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={!validationComplete() || extracting}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void processPdfFile(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {fetchError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {fetchError}
            </div>
          )}

          {selected.autoFetchSupported !== false && !selected.isMock && (
            <button
              type="button"
              disabled={!validationComplete() || extracting}
              onClick={() => void handleFetchAndExtract()}
              className="flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              Prøv automatisk hentning (virker ikke på alle sider)
            </button>
          )}

          <a
            href={selected.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center rounded-xl border-2 border-work-blue text-sm font-semibold text-work-navy"
          >
            Åbn valgt link i ny fane ↗
          </a>

          <button
            type="button"
            onClick={() => {
              setFetchError("");
              setStep("results");
            }}
            className="w-full text-sm text-gray-600 underline"
          >
            Tilbage til resultater
          </button>
        </div>
      )}

      {step === "extract" && (
        <p className="py-8 text-center text-gray-600">
          Henter og udtrækker SDS…
        </p>
      )}

      {step === "edit" && sdsDraft && (
        <div className="space-y-4">
          <SdsDataEditor value={sdsDraft} onChange={setSdsDraft} />
          <button
            type="button"
            onClick={handleSaveChemical}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-700 font-semibold text-white"
          >
            Gem som kemikaliekort
          </button>
        </div>
      )}

      {step === "worktask" && savedChemicalId && (
        <div className="space-y-4">
          <p className="text-sm text-emerald-800">
            Kemikaliekort gemt. Udfyld arbejdsopgaven for at generere kemisk
            risikovurdering.
          </p>
          <WorkTaskForm value={workTask} onChange={setWorkTask} />
          <button
            type="button"
            onClick={handleGenerateRiskAssessment}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-work-navy font-semibold text-white"
          >
            Generer kemisk risikovurdering
          </button>
        </div>
      )}

      {step === "done" && savedChemicalId && (
        <div className="space-y-3">
          <p className="text-sm text-emerald-800">
            Kemisk risikovurdering oprettet som udkast til faglig gennemgang.
          </p>
          <Link
            href={`/kemikalie/${savedChemicalId}`}
            className="flex min-h-12 items-center justify-center rounded-xl border-2 border-work-blue bg-work-sky font-semibold"
          >
            Åbn kemikaliekort
          </Link>
          {riskAssessmentId && (
            <Link
              href={`/admin/risikovurdering/${riskAssessmentId}`}
              className="flex min-h-12 items-center justify-center rounded-xl bg-work-navy font-semibold text-white"
            >
              Rediger risikovurdering
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setStep("search");
              setQuery("");
              setSearchResponse(null);
              setSelected(null);
              setSdsDraft(null);
              setSavedChemicalId(null);
              setRiskAssessmentId(null);
            }}
            className="w-full text-sm underline"
          >
            Ny online SDS-søgning
          </button>
        </div>
      )}
    </section>
  );
}

function ValidationField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ValidationAnswer;
  onChange: (v: ValidationAnswer) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-work-navy">{label}</p>
      <div className="flex gap-2">
        {(
          [
            ["ja", "Ja"],
            ["nej", "Nej"],
            ["ukendt", "Ukendt"],
          ] as const
        ).map(([v, lbl]) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`min-h-10 flex-1 rounded-lg border-2 text-sm font-medium ${
              value === v
                ? "border-work-navy bg-work-navy text-white"
                : "border-gray-200"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}
