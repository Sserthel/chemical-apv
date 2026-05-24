"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Søg kemikalie, H-kode eller lokation…",
  autoFocus = false,
}: SearchBarProps) {
  return (
    <div className="relative">
      <label htmlFor="chemical-search" className="sr-only">
        Søg kemikalier
      </label>
      <span
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400"
        aria-hidden
      >
        🔍
      </span>
      <input
        id="chemical-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-xl border-2 border-work-blue/30 bg-white py-4 pl-12 pr-4 text-base shadow-sm outline-none transition focus:border-work-blue focus:ring-2 focus:ring-work-blue/20"
        autoComplete="off"
      />
    </div>
  );
}
