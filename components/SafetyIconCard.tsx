"use client";

import { useState } from "react";
import Image from "next/image";
import { sourceLabel, type SymbolSource } from "@/lib/safety-symbols";

interface SafetyIconCardProps {
  symbolPath: string;
  label: string;
  source: SymbolSource;
  sourceDetail: string;
  variant?: "ghs" | "ppe";
  isoCode?: string;
}

export function SafetyIconCard({
  symbolPath,
  label,
  source,
  sourceDetail,
  variant = "ppe",
  isoCode,
}: SafetyIconCardProps) {
  const [src, setSrc] = useState(symbolPath);
  const [assetMissing, setAssetMissing] = useState(false);
  const isSuggestion = source === "suggestion";
  const isMissing = source === "missing";

  function handleImageError() {
    if (variant === "ghs") {
      if (src.endsWith(".svg")) {
        setSrc(src.replace(/\.svg$/i, ".gif"));
      }
      return;
    }
    setAssetMissing(true);
  }

  const title = isoCode ? `ISO 7010 ${isoCode}` : label;

  return (
    <div
      className={`flex flex-col items-center rounded-xl border p-2 text-center ${
        isSuggestion
          ? "border-dashed border-amber-400 bg-amber-50/60"
          : isMissing
            ? "border-dashed border-slate-300 bg-slate-50"
            : variant === "ppe"
              ? "border-blue-200 bg-blue-50/40"
              : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`relative flex h-14 w-14 items-center justify-center ${
          variant === "ghs" ? "rounded-sm" : "rounded-full bg-white"
        }`}
      >
        {assetMissing ? (
          <span className="px-1 text-[9px] leading-tight text-slate-600">
            ISO 7010-symbol mangler – tilføj officiel fil
          </span>
        ) : (
          <Image
            src={src}
            alt={title}
            width={56}
            height={56}
            className="h-12 w-12 object-contain"
            onError={handleImageError}
            unoptimized={src.endsWith(".gif")}
          />
        )}
      </div>
      <p className="mt-1 text-xs font-semibold text-work-navy">{title}</p>
      {isoCode && (
        <p className="text-[10px] text-gray-700">{label}</p>
      )}
      <p className="mt-0.5 text-[10px] font-medium text-gray-600">
        Kilde: {sourceLabel(source)}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-500">
        {sourceDetail}
      </p>
    </div>
  );
}
