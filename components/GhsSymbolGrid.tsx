import { SafetyIconCard } from "@/components/SafetyIconCard";
import type { GhsSymbolItem } from "@/lib/safety-symbols";
import { ghsSymbolPath } from "@/lib/safety-symbols";

interface GhsSymbolGridProps {
  symbols: GhsSymbolItem[];
  title?: string;
}

export function GhsSymbolGrid({
  symbols,
  title = "Farepiktogrammer",
}: GhsSymbolGridProps) {
  if (symbols.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        {title && (
          <h3 className="mb-2 font-semibold text-work-navy">{title}</h3>
        )}
        <p className="mb-1 text-xs text-slate-600">
          GHS/CLP farepiktogrammer (rød diamant) – produktets fareklassificering.
        </p>
        <p className="text-sm text-slate-600">
          Ingen farepiktogrammer kan udledes – mangler H-sætninger eller
          farepiktogrammer i SDS.
        </p>
      </section>
    );
  }

  return (
    <section>
      {title && (
        <h3 className="mb-1 font-semibold text-work-navy">{title}</h3>
      )}
      <p className="mb-3 text-xs text-slate-600">
        GHS/CLP farepiktogrammer (rød diamant) – produktets fareklassificering.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {symbols.map((s) => (
          <SafetyIconCard
            key={s.code}
            symbolPath={ghsSymbolPath(s.file)}
            label={`${s.code} ${s.label}`}
            source={s.source}
            sourceDetail={s.sourceDetail}
            variant="ghs"
          />
        ))}
      </div>
    </section>
  );
}
