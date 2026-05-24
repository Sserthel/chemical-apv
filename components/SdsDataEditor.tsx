"use client";

import type { SdsFullData } from "@/lib/sds-extract";
import { SDS_MISSING } from "@/lib/sds-extract";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-work-blue";

interface SdsDataEditorProps {
  value: SdsFullData;
  onChange: (value: SdsFullData) => void;
}

export function SdsDataEditor({ value, onChange }: SdsDataEditorProps) {
  const set = (patch: Partial<SdsFullData>) => onChange({ ...value, ...patch });

  const setPpe = (patch: Partial<SdsFullData["ppe"]>) =>
    onChange({ ...value, ppe: { ...value.ppe, ...patch } });

  const codesToString = (arr: string[]) => arr.join(", ");
  const stringToCodes = (s: string) =>
    s
      .split(/[,;\s]+/)
      .map((x) => x.trim().toUpperCase())
      .filter((x) => /^H\d{3}/.test(x) || /^P\d{3}/.test(x));

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-600">
        Ret udtrukne SDS-data før gem. Opfind ikke CAS, H-koder eller
        grænseværdier – brug kun det du kan verificere i SDS.
      </p>

      <Field label="Produktnavn">
        <input
          className={inputClass}
          value={value.productName === SDS_MISSING ? "" : value.productName}
          onChange={(e) => set({ productName: e.target.value || SDS_MISSING })}
        />
      </Field>
      <Field label="Leverandør">
        <input
          className={inputClass}
          value={value.supplier === SDS_MISSING ? "" : value.supplier}
          onChange={(e) => set({ supplier: e.target.value || SDS_MISSING })}
        />
      </Field>
      <Field label="SDS-dato/version">
        <input
          className={inputClass}
          value={value.sdsDate === SDS_MISSING ? "" : value.sdsDate}
          onChange={(e) => set({ sdsDate: e.target.value || SDS_MISSING })}
        />
      </Field>
      <Field label="H-sætninger (kommasepareret)">
        <input
          className={inputClass}
          value={codesToString(value.hStatements)}
          onChange={(e) => set({ hStatements: stringToCodes(e.target.value) })}
        />
      </Field>
      <Field label="P-sætninger (kommasepareret)">
        <input
          className={inputClass}
          value={codesToString(value.pStatements)}
          onChange={(e) =>
            set({
              pStatements: stringToCodes(e.target.value.replace(/^P/g, "P")),
            })
          }
        />
      </Field>
      <Field label="CAS-numre (kommasepareret)">
        <input
          className={inputClass}
          value={value.casNumbers.join(", ")}
          onChange={(e) =>
            set({
              casNumbers: e.target.value
                .split(/[,;\s]+/)
                .map((x) => x.trim())
                .filter(/\d{2,7}-\d{2}-\d/.test),
            })
          }
        />
      </Field>
      <Field label="Åndedrætsværn (SDS §8)">
        <textarea
          rows={2}
          className={inputClass}
          value={
            value.ppe.respiratoryProtection === SDS_MISSING
              ? ""
              : value.ppe.respiratoryProtection
          }
          onChange={(e) =>
            setPpe({
              respiratoryProtection: e.target.value || SDS_MISSING,
            })
          }
        />
      </Field>
      <Field label="Handsker (SDS §8)">
        <textarea
          rows={2}
          className={inputClass}
          value={
            value.ppe.handProtection === SDS_MISSING
              ? ""
              : value.ppe.handProtection
          }
          onChange={(e) =>
            setPpe({ handProtection: e.target.value || SDS_MISSING })
          }
        />
      </Field>
      <Field label="Øjenbeskyttelse (SDS §8)">
        <textarea
          rows={2}
          className={inputClass}
          value={
            value.ppe.eyeProtection === SDS_MISSING ? "" : value.ppe.eyeProtection
          }
          onChange={(e) =>
            setPpe({ eyeProtection: e.target.value || SDS_MISSING })
          }
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-work-navy">
        {label}
      </label>
      {children}
    </div>
  );
}
