"use client";

import { useAuth } from "@/context/AuthContext";
import { roleLabel, type UserRole } from "@/lib/auth/roles";

interface RoleBadgeProps {
  role?: UserRole | null;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const { role: authRole } = useAuth();
  const resolved = role ?? authRole;
  if (!resolved) return null;

  const styles =
    resolved === "admin"
      ? "bg-violet-600 text-white border-violet-700"
      : "bg-sky-600 text-white border-sky-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${styles} ${className}`}
    >
      {roleLabel(resolved)}
    </span>
  );
}
