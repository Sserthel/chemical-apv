import Link from "next/link";
import type { ReactNode } from "react";

interface BigButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  icon?: string;
}

const variants = {
  primary:
    "bg-work-navy text-white active:bg-work-blue border-transparent",
  secondary:
    "bg-work-sky text-work-navy border-work-blue/30 active:bg-work-sky/80",
  outline:
    "bg-white text-work-navy border-2 border-work-blue/40 active:bg-gray-50",
};

export function BigButton({
  href,
  children,
  variant = "primary",
  icon,
}: BigButtonProps) {
  return (
    <Link
      href={href}
      className={`flex min-h-[4.5rem] w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left text-lg font-semibold shadow-sm transition ${variants[variant]}`}
    >
      {icon && (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
      <span className="text-xl opacity-60" aria-hidden>
        →
      </span>
    </Link>
  );
}
