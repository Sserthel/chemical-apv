"use client";

import type { WorkTaskData } from "@/lib/risk-assessment-types";

interface WorkTaskFormProps {
  value: WorkTaskData;
  onChange: (value: WorkTaskData) => void;
}

const inputClass =
  "w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none focus:border-work-blue focus:ring-2 focus:ring-work-blue/20";

const labelClass = "mb-1 block text-sm font-semibold text-work-navy";

export function WorkTaskForm({ value, onChange }: WorkTaskFormProps) {
  const set = <K extends keyof WorkTaskData>(key: K, v: WorkTaskData[K]) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="arbejdsopgave">
          Arbejdsopgave
        </label>
        <textarea
          id="arbejdsopgave"
          rows={2}
          className={inputClass}
          value={value.arbejdsopgave}
          onChange={(e) => set("arbejdsopgave", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="afdeling">
          Afdeling/område
        </label>
        <input
          id="afdeling"
          className={inputClass}
          value={value.afdeling}
          onChange={(e) => set("afdeling", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="udfoerer">
          Hvem udfører arbejdet
        </label>
        <input
          id="udfoerer"
          className={inputClass}
          value={value.udfoerer}
          onChange={(e) => set("udfoerer", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="maengde">
            Mængde pr. gang
          </label>
          <input
            id="maengde"
            className={inputClass}
            value={value.maengdePrGang}
            onChange={(e) => set("maengdePrGang", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="varighed">
            Varighed pr. gang
          </label>
          <input
            id="varighed"
            className={inputClass}
            value={value.varighedPrGang}
            onChange={(e) => set("varighedPrGang", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="hyppighed">
          Hyppighed
        </label>
        <input
          id="hyppighed"
          className={inputClass}
          placeholder="fx dagligt, ugentligt"
          value={value.hyppighed}
          onChange={(e) => set("hyppighed", e.target.value)}
        />
      </div>

      <div>
        <span className={labelClass}>Åben eller lukket proces</span>
        <div className="flex gap-3">
          {(["åben", "lukket"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => set("procesType", p)}
              className={`min-h-11 flex-1 rounded-xl border-2 px-3 font-semibold capitalize ${
                value.procesType === p
                  ? "border-work-navy bg-work-navy text-white"
                  : "border-gray-200 bg-white text-gray-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <YesNoField
        label="Sprøjtning/aerosol"
        value={value.sprayAerosol}
        onChange={(v) => set("sprayAerosol", v)}
      />
      <YesNoField
        label="Opvarmning"
        value={value.opvarmning}
        onChange={(v) => set("opvarmning", v)}
      />
      <YesNoField
        label="Støvudvikling"
        value={value.stoefudvikling}
        onChange={(v) => set("stoefudvikling", v)}
      />

      <div>
        <label className={labelClass} htmlFor="ventilation">
          Ventilation
        </label>
        <input
          id="ventilation"
          className={inputClass}
          value={value.ventilation}
          onChange={(e) => set("ventilation", e.target.value)}
        />
      </div>

      <YesNoField
        label="Punktudsugning"
        value={value.punktudsugning}
        onChange={(v) => set("punktudsugning", v)}
      />

      <div>
        <label className={labelClass} htmlFor="vaernemidler">
          Brugte værnemidler
        </label>
        <textarea
          id="vaernemidler"
          rows={2}
          className={inputClass}
          value={value.vaernemidler}
          onChange={(e) => set("vaernemidler", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="risikoHud">
          Risiko for hudkontakt
        </label>
        <input
          id="risikoHud"
          className={inputClass}
          value={value.risikoHudkontakt}
          onChange={(e) => set("risikoHudkontakt", e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="risikoInd">
          Risiko for indånding
        </label>
        <input
          id="risikoInd"
          className={inputClass}
          value={value.risikoIndaanding}
          onChange={(e) => set("risikoIndaanding", e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="risikoOeje">
          Risiko for øjenkontakt
        </label>
        <input
          id="risikoOeje"
          className={inputClass}
          value={value.risikoOejnkontakt}
          onChange={(e) => set("risikoOejnkontakt", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="opbevaring">
          Opbevaring på arbejdsstedet
        </label>
        <textarea
          id="opbevaring"
          rows={2}
          className={inputClass}
          value={value.opbevaringArbejdssted}
          onChange={(e) => set("opbevaringArbejdssted", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="affald">
          Affald/spildhåndtering
        </label>
        <textarea
          id="affald"
          rows={2}
          className={inputClass}
          value={value.affaldSpild}
          onChange={(e) => set("affaldSpild", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="instruktion">
          Eksisterende instruktion
        </label>
        <textarea
          id="instruktion"
          rows={2}
          className={inputClass}
          value={value.eksisterendeInstruktion}
          onChange={(e) => set("eksisterendeInstruktion", e.target.value)}
        />
      </div>
    </div>
  );
}

function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "ja" | "nej";
  onChange: (v: "ja" | "nej") => void;
}) {
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="flex gap-3">
        {(["ja", "nej"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`min-h-11 flex-1 rounded-xl border-2 font-semibold ${
              value === v
                ? "border-work-navy bg-work-navy text-white"
                : "border-gray-200 bg-white"
            }`}
          >
            {v === "ja" ? "Ja" : "Nej"}
          </button>
        ))}
      </div>
    </div>
  );
}
