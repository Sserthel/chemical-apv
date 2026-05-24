import type { SdsFullData } from "@/lib/sds-extract";
import { SDS_MISSING } from "@/lib/sds-extract";
import type { SystemSuggestion } from "@/lib/sds-suggestions";
import { SUGGESTION_PREFIX } from "@/lib/sds-suggestions";

function SdsValue({ value, mono }: { value: string | string[]; mono?: boolean }) {
  const hasValue = Array.isArray(value)
    ? value.length > 0
    : Boolean(value?.trim()) && value.trim() !== SDS_MISSING;

  if (!hasValue) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Mangler oplysninger
      </p>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ul className={`list-inside list-disc text-sm text-gray-800 ${mono ? "font-mono" : ""}`}>
        {value.map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className={`whitespace-pre-wrap text-sm text-gray-800 ${mono ? "font-mono text-xs" : ""}`}>
      {value}
    </p>
  );
}

interface SdsInfoPanelProps {
  sds: SdsFullData;
  suggestions?: SystemSuggestion[];
  compact?: boolean;
}

export function SdsInfoPanel({ sds, suggestions = [], compact }: SdsInfoPanelProps) {
  if (compact) {
    return (
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-semibold">H:</span>{" "}
          {sds.hStatements.length > 0
            ? sds.hStatements.join(", ")
            : "Mangler oplysninger"}
        </p>
        {sds.missingFields.length > 0 && (
          <p className="text-amber-800">
            {sds.missingFields.length} felt(er) mangler i SDS-udtræk
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Oplysninger direkte fra SDS
        </h3>
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div>
            <h4 className="text-xs font-semibold text-emerald-900">
              Sektion 1 – Produkt
            </h4>
            <SdsValue value={sds.productName} />
            <p className="mt-1 text-xs text-gray-500">Leverandør</p>
            <SdsValue value={sds.supplier} />
            <p className="mt-1 text-xs text-gray-500">SDS-dato</p>
            <SdsValue value={sds.sdsDate} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-900">
              Sektion 2 – Fare
            </h4>
            <p className="text-xs text-gray-500">Signalord</p>
            <SdsValue value={sds.signalWord} />
            <p className="mt-1 text-xs text-gray-500">Piktogrammer</p>
            <SdsValue value={sds.hazardPictograms} />
            <p className="mt-1 text-xs text-gray-500">H-sætninger</p>
            <SdsValue value={sds.hStatements} mono />
            <p className="mt-1 text-xs text-gray-500">P-sætninger</p>
            <SdsValue value={sds.pStatements} mono />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-900">
              Sektion 3 – Indhold
            </h4>
            <SdsValue value={sds.ingredients} />
            <p className="mt-1 text-xs text-gray-500">CAS-numre</p>
            <SdsValue value={sds.casNumbers} mono />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-900">
              Sektion 4 – Førstehjælp
            </h4>
            <SdsValue value={`Indånding: ${sds.firstAid.inhalation}`} />
            <SdsValue value={`Hud: ${sds.firstAid.skin}`} />
            <SdsValue value={`Øjne: ${sds.firstAid.eyes}`} />
            <SdsValue value={`Indtagelse: ${sds.firstAid.ingestion}`} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-900">
              Sektion 5 – Brand
            </h4>
            <SdsValue value={sds.fireFighting.suitableExtinguishingMedia} />
            <SdsValue value={sds.fireFighting.specialHazards} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-900">
              Sektion 6–7 – Spild, håndtering, opbevaring
            </h4>
            <SdsValue value={sds.spillResponse} />
            <SdsValue value={sds.handling} />
            <SdsValue value={sds.storage} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-900">
              Sektion 8 – Værnemidler og grænseværdier
            </h4>
            <SdsValue value={sds.exposureLimits} />
            <SdsValue value={sds.ppe.respiratoryProtection} />
            <SdsValue value={sds.ppe.handProtection} />
            <SdsValue value={sds.ppe.eyeProtection} />
            <SdsValue value={sds.ppe.skinProtection} />
            <SdsValue value={sds.ppe.ventilation} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-900">
              Sektion 10–13–15
            </h4>
            <SdsValue value={sds.incompatibleMaterials} />
            <SdsValue value={sds.disposal} />
            <SdsValue value={sds.environmentalPrecautions} />
            <SdsValue value={sds.regulatoryInfo} />
          </div>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-work-blue">
            <span className="h-2 w-2 rounded-full bg-work-blue" />
            Systemets forslag
          </h3>
          <ul className="space-y-2 rounded-2xl border border-work-blue/30 bg-work-sky/40 p-4">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-work-navy">
                {s.text.startsWith(SUGGESTION_PREFIX) ? s.text : `${SUGGESTION_PREFIX}: ${s.text}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sds.missingFields.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Manglende oplysninger
          </h3>
          <ul className="list-inside list-disc rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {sds.missingFields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
