import { SafetyIconCard } from "@/components/SafetyIconCard";
import type { PpeSymbolItem } from "@/lib/safety-symbols";
import { ppeSymbolPath } from "@/lib/safety-symbols";

interface PpeSymbolGridProps {
  items: PpeSymbolItem[];
  title?: string;
}

export function PpeSymbolGrid({
  items,
  title = "Personlige værnemidler",
}: PpeSymbolGridProps) {
  const required = items.filter((i) => i.source !== "suggestion");
  const suggested = items.filter((i) => i.source === "suggestion");

  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-4">
        <h3 className="mb-2 font-semibold text-work-navy">{title}</h3>
        <p className="text-sm text-slate-600">
          Ingen personlige værnemidler oplyst i SDS sektion 8 eller arbejdsopgave.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          PPE-symboler er påbud (ISO 7010) – ikke fareklassificering. De erstatter
          ikke SDS eller APV-godkendelse.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="mb-1 font-semibold text-work-navy">{title}</h3>
        <p className="mb-3 text-xs text-slate-600">
          ISO 7010 påbudssymboler (blå cirkel) – adskilt fra GHS/CLP-farepiktogrammer.
        </p>
        {required.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {required.map((s) => (
              <SafetyIconCard
                key={`${s.isoCode}-${s.source}`}
                symbolPath={ppeSymbolPath(s.file)}
                label={s.label}
                isoCode={s.isoCode}
                source={s.source}
                sourceDetail={s.sourceDetail}
                variant="ppe"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Ingen dokumenteret PPE – se forslag nedenfor.
          </p>
        )}
      </div>

      {suggested.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <h4 className="mb-2 text-sm font-semibold text-amber-900">
            Forslag – kræver faglig vurdering
          </h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {suggested.map((s) => (
              <SafetyIconCard
                key={`${s.isoCode}-suggest`}
                symbolPath={ppeSymbolPath(s.file)}
                label={s.label}
                isoCode={s.isoCode}
                source={s.source}
                sourceDetail={s.sourceDetail}
                variant="ppe"
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        PPE-symboler angiver påbud om personligt værn. De må ikke bruges som
        erstatning for SDS, risikovurdering eller APV-godkendelse.
      </p>
    </section>
  );
}
