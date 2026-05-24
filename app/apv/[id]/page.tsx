"use client";

import { use } from "react";
import { ApvView } from "@/components/ApvView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ApvPage({ params }: PageProps) {
  const { id } = use(params);
  return <ApvView id={id} />;
}
