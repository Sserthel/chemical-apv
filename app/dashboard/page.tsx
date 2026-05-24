"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(isAdmin ? "/admin" : "/medarbejder");
  }, [loading, isAdmin, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-gray-600">
      Omdirigerer…
    </div>
  );
}
