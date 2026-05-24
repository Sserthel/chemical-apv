"use client";

import { use } from "react";
import { ApvView } from "@/components/ApvView";
import { RequireAdmin } from "@/components/RequireAdmin";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApvPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <RequireAdmin>
      <ApvView id={id} />
    </RequireAdmin>
  );
}
