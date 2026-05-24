"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { useChemicalStore } from "@/context/ChemicalStoreContext";

interface SdsTextViewProps {
  id: string;
}

export function SdsTextView({ id }: SdsTextViewProps) {
  const { hydrated, getChemicalById } = useChemicalStore();
  const chemical = getChemicalById(id);

  if (!hydrated) {
    return (
      <div className="px-4 py-12 text-center text-gray-600">Indlæser…</div>
    );
  }

  if (!chemical?.sdsFullText) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-600">SDS-tekst findes ikke for dette produkt.</p>
        <Link
          href={`/kemikalie/${id}`}
          className="mt-4 inline-block text-work-blue underline"
        >
          Til kemikaliekort
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="SDS-tekst"
        backHref={`/kemikalie/${id}`}
        backLabel="Til kemikaliekort"
      />
      <div className="px-4 py-4">
        <p className="mb-3 text-sm text-gray-600">
          {chemical.uploadedFileName ?? chemical.productName}
        </p>
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-xs leading-relaxed text-gray-800 shadow-sm">
          {chemical.sdsFullText}
        </pre>
        <Link
          href={`/kemikalie/${id}/udtruk`}
          className="mt-4 block text-center text-sm font-medium text-work-blue underline"
        >
          Udtrukne oplysninger
        </Link>
      </div>
    </div>
  );
}
