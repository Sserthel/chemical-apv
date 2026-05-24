"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useChemicalStore } from "@/context/ChemicalStoreContext";
import { useAuth } from "@/context/AuthContext";

interface RiskAssessmentEmployeeViewProps {
  chemicalId: string;
}

/** Fuld risikovurdering – kun HSE/admin (?full=1). Medarbejdere sendes til /medarbejder. */
export function RiskAssessmentEmployeeView({
  chemicalId,
}: RiskAssessmentEmployeeViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin } = useAuth();
  const full = searchParams.get("full") === "1";
  const { hydrated, getChemicalById, getPublishedRiskAssessment } =
    useChemicalStore();
  const chemical = getChemicalById(chemicalId);
  const assessment = getPublishedRiskAssessment(chemicalId);

  useEffect(() => {
    if (hydrated && (!full || !isAdmin)) {
      router.replace(`/medarbejder/${chemicalId}`);
    }
  }, [hydrated, full, isAdmin, chemicalId, router]);

  if (!hydrated || !full || !isAdmin) {
    return <div className="px-4 py-12 text-center text-gray-600">Indlæser…</div>;
  }

  if (!chemical || !assessment) {
    return (
      <div>
        <Header title="Kemisk risikovurdering" backHref="/admin" />
        <div className="px-4 py-8 text-center text-gray-600">
          <p>Ingen publiceret risikovurdering.</p>
          <Link href="/admin" className="mt-4 inline-block text-work-blue underline">
            Administration
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Fuld risikovurdering (HSE)" backHref={`/medarbejder/${chemicalId}`} />
      <div className="space-y-4 px-4 py-4">
        <p className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
          Denne side er til faglig gennemgang. Medarbejdere skal bruge{" "}
          <Link href={`/medarbejder/${chemicalId}`} className="text-work-blue underline">
            medarbejderinstruktionen
          </Link>
          .
        </p>
        {assessment.sections.map((section) => (
          <section
            key={section.key}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h2 className="mb-2 font-semibold text-work-navy">{section.title}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
