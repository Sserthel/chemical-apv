import Link from "next/link";

interface HeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

export function Header({
  title,
  backHref = "/",
  backLabel = "Tilbage",
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-work-blue/20 bg-work-navy text-white shadow-md">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
        {backHref && (
          <Link
            href={backHref}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-medium active:bg-white/20"
            aria-label={backLabel}
          >
            ←
          </Link>
        )}
        <h1 className="text-lg font-semibold leading-tight">{title}</h1>
      </div>
    </header>
  );
}
