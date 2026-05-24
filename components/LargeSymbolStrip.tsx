"use client";

import Image from "next/image";
import {
  ghsSymbolPath,
  ppeSymbolPath,
  type GhsSymbolItem,
  type PpeSymbolItem,
} from "@/lib/safety-symbols";

interface LargeSymbolStripProps {
  ghs: GhsSymbolItem[];
  ppe: PpeSymbolItem[];
}

function LargeGhs({ item }: { item: GhsSymbolItem }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
        <Image
          src={ghsSymbolPath(item.file)}
          alt={item.label}
          width={96}
          height={96}
          className="h-full w-full object-contain"
          unoptimized={ghsSymbolPath(item.file).endsWith(".gif")}
        />
      </div>
      <p className="mt-1 max-w-[5rem] text-center text-[10px] font-medium text-gray-700">
        {item.code}
      </p>
    </div>
  );
}

function LargePpe({ item }: { item: PpeSymbolItem }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white sm:h-24 sm:w-24">
        <Image
          src={ppeSymbolPath(item.file)}
          alt={item.label}
          width={96}
          height={96}
          className="h-16 w-16 object-contain sm:h-20 sm:w-20"
        />
      </div>
      <p className="mt-1 text-center text-[10px] font-bold text-blue-900">
        {item.isoCode}
      </p>
    </div>
  );
}

export function LargeSymbolStrip({ ghs, ppe }: LargeSymbolStripProps) {
  return (
    <div className="space-y-4">
      {ghs.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Farepiktogrammer
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {ghs.map((g) => (
              <LargeGhs key={g.code} item={g} />
            ))}
          </div>
        </div>
      )}
      {ppe.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
            Personlige værnemidler (ISO 7010)
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {ppe.map((p) => (
              <LargePpe key={`${p.isoCode}-${p.source}`} item={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
