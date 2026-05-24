"use client";

import { useAuth } from "@/context/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";

interface RequireAdminProps {
  children: React.ReactNode;
  backHref?: string;
}

export function RequireAdmin({
  children,
  backHref = "/employee",
}: RequireAdminProps) {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-600">
        Indlæser…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AccessDenied
        message="Du har ikke adgang til denne side."
        backHref={backHref}
        backLabel="Til medarbejder"
      />
    );
  }

  return children;
}
