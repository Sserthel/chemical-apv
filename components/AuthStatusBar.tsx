"use client";

import { usePathname } from "next/navigation";
import { RoleBadge } from "@/components/RoleBadge";
import { useAuth } from "@/context/AuthContext";

export function AuthStatusBar() {
  const pathname = usePathname();
  const { user, loading, signOut, roleDisplay, role } = useAuth();

  if (pathname === "/login" || !user) {
    return null;
  }

  return (
    <div className="border-b border-work-blue/20 bg-work-navy/95 px-4 py-2 text-white">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {role ? <RoleBadge role={role} /> : loading ? (
            <span className="text-xs text-work-sky/70">Indlæser rolle…</span>
          ) : null}
          <span className="truncate text-xs text-work-sky/90">{user.email}</span>
        </div>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            window.location.href = "/login";
          }}
          className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold active:bg-white/20"
        >
          Log ud
        </button>
      </div>
      {roleDisplay && (
        <p className="mx-auto mt-1 max-w-lg text-[10px] uppercase tracking-wide text-work-sky/70">
          Logget ind som {roleDisplay.toLowerCase()}
        </p>
      )}
    </div>
  );
}
