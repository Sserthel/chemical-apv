"use client";

import Link from "next/link";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export function AccessDenied({
  title = "Ingen adgang",
  message = "Du har ikke adgang til denne side.",
  backHref = "/dashboard",
  backLabel = "Til dashboard",
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🚫
        </p>
        <h1 className="mt-3 text-xl font-bold text-red-950">{title}</h1>
        <p className="mt-3 text-base text-red-900">{message}</p>
        <Link
          href={backHref}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-work-navy px-6 font-semibold text-white active:bg-work-blue"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
