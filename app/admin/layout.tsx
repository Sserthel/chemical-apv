"use client";

import { AccessDenied } from "@/components/AccessDenied";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        backHref="/employee"
        backLabel="Til medarbejder"
      />
    );
  }

  return children;
}
