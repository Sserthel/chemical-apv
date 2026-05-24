interface MissingFieldProps {
  label: string;
  value: string | string[] | null | undefined;
  mono?: boolean;
}

const MISSING = "Mangler oplysninger – udfyld manuelt";

export function MissingField({ label, value, mono }: MissingFieldProps) {
  const hasValue = Array.isArray(value)
    ? value.length > 0
    : Boolean(value?.trim());

  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-work-navy">{label}</h4>
      {hasValue ? (
        Array.isArray(value) ? (
          <ul className="list-inside list-disc space-y-1 text-gray-800">
            {value.map((item) => (
              <li key={item} className={mono ? "font-mono text-sm" : undefined}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p
            className={`whitespace-pre-wrap text-sm text-gray-800 ${mono ? "font-mono" : ""}`}
          >
            {value}
          </p>
        )
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {MISSING}
        </p>
      )}
    </div>
  );
}

export { MISSING };
