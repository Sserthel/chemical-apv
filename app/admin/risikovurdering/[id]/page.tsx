"use client";

import { use } from "react";
import { RiskAssessmentEditor } from "@/components/RiskAssessmentEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RiskAssessmentEditPage({ params }: PageProps) {
  const { id } = use(params);
  return <RiskAssessmentEditor id={id} />;
}
