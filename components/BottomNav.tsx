"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAuthEmail } from "@/lib/auth/email";
import { isAdminUser } from "@/lib/auth/roles";
import { useAuth } from "@/context/AuthContext";

const baseLinks = [
  { href: "/", label: "Forside", icon: "🏠" },
  { href: "/soeg", label: "Søg", icon: "🔍" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const authEmail = getAuthEmail(user, profile);
  const showAdmin = isAdminUser(authEmail, profile?.role);

  if (pathname === "/login") {
    return null;
  }

  const links = [
    ...baseLinks,
    showAdmin
      ? { href: "/admin", label: "Admin", icon: "⚙️" }
      : { href: "/medarbejder", label: "Sikkerhed", icon: "👷" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
      aria-label="Hovednavigation"
    >
      <div className="mx-auto flex max-w-lg">
        {loading && !user ? (
          <div className="flex min-h-[4.25rem] flex-1 items-center justify-center text-xs text-gray-500">
            Indlæser…
          </div>
        ) : (
          links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-h-[4.25rem] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  active
                    ? "text-work-blue bg-work-sky/50"
                    : "text-gray-600 active:bg-gray-50"
                }`}
              >
                <span className="text-xl" aria-hidden>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })
        )}
      </div>
    </nav>
  );
}
