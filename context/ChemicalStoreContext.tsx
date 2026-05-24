"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mergeChemicals, getApvForId, searchAll } from "@/lib/chemicals";
import { ensureMockRiskAssessmentsSeeded } from "@/lib/mock-risk-assessments";
import {
  deleteRiskAssessment,
  loadRiskAssessments,
  saveRiskAssessments,
} from "@/lib/risk-assessment-storage";
import type { ChemicalRiskAssessment } from "@/lib/risk-assessment-types";
import { addUpload, loadUploads, removeUpload } from "@/lib/storage";
import type { Chemical, ChemicalApv, StoredUpload } from "@/lib/types";

interface ChemicalStoreValue {
  hydrated: boolean;
  uploads: StoredUpload[];
  allChemicals: Chemical[];
  riskAssessments: ChemicalRiskAssessment[];
  addFromSds: (record: StoredUpload) => void;
  deleteUpload: (id: string) => void;
  getChemicalById: (id: string) => Chemical | undefined;
  getApvByChemicalId: (id: string) => ChemicalApv | undefined;
  searchChemicals: (query: string) => Chemical[];
  saveRiskAssessment: (assessment: ChemicalRiskAssessment) => void;
  deleteRiskAssessmentById: (id: string) => void;
  getRiskAssessmentById: (id: string) => ChemicalRiskAssessment | undefined;
  getPublishedRiskAssessment: (chemicalId: string) => ChemicalRiskAssessment | undefined;
  getRiskAssessmentsForChemical: (chemicalId: string) => ChemicalRiskAssessment[];
}

const ChemicalStoreContext = createContext<ChemicalStoreValue | null>(null);

export function ChemicalStoreProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<StoredUpload[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<ChemicalRiskAssessment[]>(
    []
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    ensureMockRiskAssessmentsSeeded();
    setUploads(loadUploads());
    setRiskAssessments(loadRiskAssessments());
    setHydrated(true);
  }, []);

  const allChemicals = useMemo(() => mergeChemicals(uploads), [uploads]);

  const addFromSds = useCallback((record: StoredUpload) => {
    addUpload(record);
    setUploads((prev) => [record, ...prev]);
  }, []);

  const deleteUpload = useCallback((id: string) => {
    removeUpload(id);
    setUploads((prev) => prev.filter((u) => u.chemical.id !== id));
  }, []);

  const getChemicalById = useCallback(
    (id: string) => allChemicals.find((c) => c.id === id),
    [allChemicals]
  );

  const getApvByChemicalId = useCallback(
    (id: string) => getApvForId(id, uploads),
    [uploads]
  );

  const searchChemicals = useCallback(
    (query: string) => searchAll(query, uploads),
    [uploads]
  );

  const saveRiskAssessment = useCallback((assessment: ChemicalRiskAssessment) => {
    const updated = {
      ...assessment,
      updatedAt: new Date().toISOString(),
    };

    setRiskAssessments((prev) => {
      let next = [...prev];
      const idx = next.findIndex((a) => a.id === updated.id);

      if (updated.status === "publiceret") {
        next = next.map((a) =>
          a.chemicalId === updated.chemicalId &&
          a.id !== updated.id &&
          a.status === "publiceret"
            ? { ...a, status: "klar" as const, updatedAt: updated.updatedAt }
            : a
        );
      }

      if (idx >= 0) next[idx] = updated;
      else next = [updated, ...next];

      saveRiskAssessments(next);
      return next;
    });
  }, []);

  const deleteRiskAssessmentById = useCallback((id: string) => {
    deleteRiskAssessment(id);
    setRiskAssessments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getRiskAssessmentById = useCallback(
    (id: string) => riskAssessments.find((a) => a.id === id),
    [riskAssessments]
  );

  const getPublishedRiskAssessment = useCallback(
    (chemicalId: string) =>
      riskAssessments.find(
        (a) => a.chemicalId === chemicalId && a.status === "publiceret"
      ),
    [riskAssessments]
  );

  const getRiskAssessmentsForChemical = useCallback(
    (chemicalId: string) =>
      riskAssessments.filter((a) => a.chemicalId === chemicalId),
    [riskAssessments]
  );

  const value = useMemo(
    () => ({
      hydrated,
      uploads,
      allChemicals,
      riskAssessments,
      addFromSds,
      deleteUpload,
      getChemicalById,
      getApvByChemicalId,
      searchChemicals,
      saveRiskAssessment,
      deleteRiskAssessmentById,
      getRiskAssessmentById,
      getPublishedRiskAssessment,
      getRiskAssessmentsForChemical,
    }),
    [
      hydrated,
      uploads,
      allChemicals,
      riskAssessments,
      addFromSds,
      deleteUpload,
      getChemicalById,
      getApvByChemicalId,
      searchChemicals,
      saveRiskAssessment,
      deleteRiskAssessmentById,
      getRiskAssessmentById,
      getPublishedRiskAssessment,
      getRiskAssessmentsForChemical,
    ]
  );

  return (
    <ChemicalStoreContext.Provider value={value}>
      {children}
    </ChemicalStoreContext.Provider>
  );
}

export function useChemicalStore(): ChemicalStoreValue {
  const ctx = useContext(ChemicalStoreContext);
  if (!ctx) {
    throw new Error("useChemicalStore skal bruges inden for ChemicalStoreProvider");
  }
  return ctx;
}
