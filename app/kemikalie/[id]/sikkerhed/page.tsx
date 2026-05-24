"use client";

import { use } from "react";
import { EmployeeSafetyView } from "@/components/EmployeeSafetyView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeSafetyPage({ params }: PageProps) {
  const { id } = use(params);
  return <EmployeeSafetyView chemicalId={id} />;
}
