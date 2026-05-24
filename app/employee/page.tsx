"use client";

import { BigButton } from "@/components/BigButton";
import { Header } from "@/components/Header";
import { MedarbejderIndexView } from "@/components/MedarbejderIndexView";
import { RoleBadge } from "@/components/RoleBadge";
import { useAuth } from "@/context/AuthContext";

export default function EmployeePage() {
  const { profile } = useAuth();

  return (
    <div>
      <Header title="Medarbejder" backHref="/" backLabel="Forside" />
      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge />
            <p className="text-sm text-sky-950">
              Velkommen{profile?.full_name ? `, ${profile.full_name}` : ""}. Her
              finder du godkendte sikkerhedsinstruktioner.
            </p>
          </div>
        </div>

        <BigButton href="/soeg" icon="🔍" variant="primary">
          Søg kemikalier
        </BigButton>
        <BigButton href="/medarbejder" icon="👷" variant="secondary">
          Medarbejdervisning
        </BigButton>
      </div>

      <MedarbejderIndexView embedded />
    </div>
  );
}
