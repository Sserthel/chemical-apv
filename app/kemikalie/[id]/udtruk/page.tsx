"use client";

import { use } from "react";
import ExtractedSdsView from "@/components/ExtractedSdsView";
import { RequireAdmin } from "@/components/RequireAdmin";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ExtractedPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <RequireAdmin>
      <ExtractedSdsView id={id} />
    </RequireAdmin>
  );
}
