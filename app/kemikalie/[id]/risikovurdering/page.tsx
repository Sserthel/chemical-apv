"use client";

import { Suspense, use } from "react";
import { RiskAssessmentEmployeeView } from "@/components/RiskAssessmentEmployeeView";

interface PageProps {
  params: Promise<{ id: string }>;
}

function RiskAssessmentPageInner({ id }: { id: string }) {
  return <RiskAssessmentEmployeeView chemicalId={id} />;
}

export default function RiskAssessmentPublicPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="px-4 py-12 text-center">Indlæser…</div>}>
      <RiskAssessmentPageInner id={id} />
    </Suspense>
  );
}
