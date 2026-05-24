"use client";

import { BigButton } from "@/components/BigButton";
import { ChemicalCard } from "@/components/ChemicalCard";
import { RoleBadge } from "@/components/RoleBadge";
import { useAuth } from "@/context/AuthContext";
import { useChemicalStore } from "@/context/ChemicalStoreContext";

export default function HomePage() {
  const { hydrated, allChemicals } = useChemicalStore();
  const { isAdmin, loading: authLoading } = useAuth();
  const featured = allChemicals.slice(0, 2);

  return (
    <div>
      <section className="bg-work-navy px-4 pb-8 pt-10 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-work-sky/90">
            Arbejdsmiljø
          </p>
          {!authLoading && <RoleBadge />}
        </div>
        <h1 className="mt-1 text-3xl font-bold leading-tight">Kemisk APV</h1>
        <p className="mt-2 text-work-sky/90">
          Find kemikalier, læs APV og åbn sikkerhedsdatablade – hurtigt på
          mobilen.
        </p>
      </section>

      <div className="space-y-4 px-4 py-6">
        <BigButton href="/soeg" icon="🔍" variant="primary">
          Søg kemikalier
        </BigButton>
        <BigButton href="/medarbejder" icon="👷" variant="primary">
          Medarbejdervisning
        </BigButton>
        {isAdmin && (
          <BigButton href="/admin" icon="⚙️" variant="outline">
            Administration
          </BigButton>
        )}

        <div className="pt-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Seneste kemikalier
          </h2>
          {!hydrated ? (
            <p className="text-sm text-gray-500">Indlæser…</p>
          ) : (
            <div className="space-y-4">
              {featured.map((c) => (
                <ChemicalCard key={c.id} chemical={c} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
