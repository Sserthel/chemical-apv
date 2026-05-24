"use client";

import { AccessDenied } from "@/components/AccessDenied";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, isAdmin, user, roleDisplay } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-600">
        Indlæser…
      </div>
    );
  }

  if (!user) {
    return (
      <AccessDenied
        title="Log ind påkrævet"
        message="Du skal logge ind for at se administration."
        backHref="/login?next=/admin"
        backLabel="Gå til login"
      />
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

  return (
    <>
      {roleDisplay && (
        <p className="px-4 pt-2 text-xs text-gray-500">
          Logget ind som {roleDisplay.toLowerCase()}
        </p>
      )}
      {children}
    </>
  );
}
