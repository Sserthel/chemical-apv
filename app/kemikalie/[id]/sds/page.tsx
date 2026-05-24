"use client";

import { use } from "react";
import { SdsTextView } from "@/components/SdsTextView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SdsTextPage({ params }: PageProps) {
  const { id } = use(params);
  return <SdsTextView id={id} />;
}
