"use client";

import { useMemo, useState } from "react";
import { ChemicalCard } from "@/components/ChemicalCard";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { useChemicalStore } from "@/context/ChemicalStoreContext";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { hydrated, searchChemicals } = useChemicalStore();
  const results = useMemo(
    () => (hydrated ? searchChemicals(query) : []),
    [hydrated, query, searchChemicals]
  );

  return (
    <div>
      <Header title="Søg kemikalier" backHref="/" />
      <div className="space-y-4 px-4 py-4">
        <SearchBar value={query} onChange={setQuery} autoFocus />
        <p className="text-sm text-gray-600">
          {!hydrated
            ? "Indlæser…"
            : `${results.length} ${results.length === 1 ? "kemikalie" : "kemikalier"} fundet`}
        </p>
        <div className="space-y-4">
          {hydrated && results.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-center text-gray-600">
              Ingen kemikalier matcher din søgning. Prøv produktnavn, H-kode
              eller lokation.
            </p>
          ) : (
            results.map((c) => <ChemicalCard key={c.id} chemical={c} />)
          )}
        </div>
      </div>
    </div>
  );
}
