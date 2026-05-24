"use client";

import { AccessDenied } from "@/components/AccessDenied";
import { getAuthEmail } from "@/lib/auth/email";
import { isAdminUser } from "@/lib/auth/roles";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, profile, roleDisplay } = useAuth();
  const authEmail = getAuthEmail(user, profile);
  const admin = isAdminUser(authEmail, profile?.role);

  if (loading && !user) {
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

  if (!admin) {
    return (
      <AccessDenied
        message={`Du har ikke adgang til administration. Logget ind som ${authEmail ?? "ukendt e-mail"}.`}
        backHref="/medarbejder"
        backLabel="Til medarbejdervisning"
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
