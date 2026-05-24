"use client";

import { use } from "react";
import ExtractedSdsView from "@/components/ExtractedSdsView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ExtractedPage({ params }: PageProps) {
  const { id } = use(params);
  return <ExtractedSdsView id={id} />;
}
