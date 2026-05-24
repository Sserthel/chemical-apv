"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { createUploadFromSds } from "@/lib/build-from-sds";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { hasMissingSdsFields } from "@/lib/sds-extract";

export function SdsUpload() {
  const { addFromSds } = useChemicalStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "reading" | "parsing" | "done" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("error");
      setMessage("Vælg en PDF-fil (sikkerhedsdatablad).");
      return;
    }

    setStatus("reading");
    setMessage("Læser PDF…");
    setLastId(null);

    try {
      const text = await extractTextFromPdf(file);
      if (!text.trim()) {
        setStatus("error");
        setMessage(
          "Kunne ikke læse tekst fra PDF. Prøv en anden fil eller en tekstbaseret SDS."
        );
        return;
      }

      setStatus("parsing");
      setMessage("Udtrækker oplysninger…");

      const record = createUploadFromSds(file.name, text);
      addFromSds(record);
      setLastId(record.chemical.id);

      const incomplete = hasMissingSdsFields(record.chemical.sdsExtracted!);
      setStatus("done");
      setMessage(
        incomplete
          ? `Kemikaliekort oprettet for «${record.chemical.productName}». ${record.chemical.sdsExtracted!.missingFields.length} SDS-felt(er) mangler – se kortet.`
          : `Kemikaliekort oprettet for «${record.chemical.productName}». SDS sektion 1–15 udtrukket.`
      );
    } catch {
      setStatus("error");
      setMessage(
        "Fejl ved behandling af PDF. Kontrollér filen og prøv igen."
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-2xl border-2 border-dashed border-work-blue/40 bg-white p-5 shadow-sm">
      <h2 className="mb-2 font-semibold text-work-navy">
        Upload sikkerhedsdatablad (PDF)
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        PDF behandles lokalt i browseren. Data gemmes i localStorage på denne
        enhed.
      </p>

      <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-xl bg-work-navy px-4 text-center font-semibold text-white active:bg-work-blue">
        {status === "reading" || status === "parsing"
          ? message
          : "Vælg PDF-fil"}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={status === "reading" || status === "parsing"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>

      {message && status !== "idle" && (
        <p
          className={`mt-3 text-sm ${
            status === "error" ? "text-red-700" : "text-gray-700"
          }`}
          role="status"
        >
          {message}
        </p>
      )}

      {lastId && status === "done" && (
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={`/kemikalie/${lastId}`}
            className="flex min-h-12 items-center justify-center rounded-xl border-2 border-work-blue bg-work-sky font-semibold text-work-navy"
          >
            Åbn kemikaliekort
          </Link>
          <Link
            href={`/kemikalie/${lastId}/udtruk`}
            className="text-center text-sm font-medium text-work-blue underline"
          >
            Se udtrukne oplysninger
          </Link>
        </div>
      )}
    </section>
  );
}
