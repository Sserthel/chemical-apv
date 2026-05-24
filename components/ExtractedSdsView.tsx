"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { SdsInfoPanel } from "@/components/SdsInfoPanel";
import { useChemicalStore } from "@/context/ChemicalStoreContext";

interface ExtractedSdsViewProps {
  id: string;
}

export default function ExtractedSdsView({ id }: ExtractedSdsViewProps) {
  const { hydrated, getChemicalById } = useChemicalStore();
  const chemical = getChemicalById(id);
  const sds = chemical?.sdsExtracted;

  if (!hydrated) {
    return (
      <div className="px-4 py-12 text-center text-gray-600">Indlæser…</div>
    );
  }

  if (!chemical || !sds) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-gray-600">Udtrukne SDS-oplysninger findes ikke.</p>
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
        title="Udtrukne SDS-oplysninger"
        backHref={`/kemikalie/${id}`}
        backLabel="Til kemikaliekort"
      />
      <div className="space-y-4 px-4 py-4">
        <p className="text-sm text-gray-600">
          Udtræk fra {chemical.uploadedFileName ?? "SDS"}. Kun tekst fra PDF –
          intet opfundet.
        </p>

        {sds.sourceSections.length > 0 && (
          <details className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
            <summary className="cursor-pointer font-semibold text-work-navy">
              Kildeafsnit ({sds.sourceSections.length})
            </summary>
            <ul className="mt-2 space-y-2 text-gray-700">
              {sds.sourceSections.map((s) => (
                <li key={s.section}>
                  <strong>
                    Sektion {s.section}: {s.title}
                  </strong>
                  <p className="text-xs">{s.excerpt.slice(0, 200)}…</p>
                </li>
              ))}
            </ul>
          </details>
        )}

        <SdsInfoPanel
          sds={sds}
          suggestions={chemical.systemSuggestions}
        />

        <Link
          href={`/kemikalie/${id}/sds`}
          className="flex min-h-12 items-center justify-center rounded-xl border-2 border-work-blue font-semibold text-work-navy"
        >
          Se fuld SDS-tekst
        </Link>
      </div>
    </div>
  );
}
