"use client";

import { use } from "react";
import { ChemicalDetailView } from "@/components/ChemicalDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChemicalDetailPage({ params }: PageProps) {
  const { id } = use(params);
  return <ChemicalDetailView id={id} />;
}
