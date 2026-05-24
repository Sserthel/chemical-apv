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
import { chemicalFromAssessment } from "@/lib/chemical-from-assessment";
import { getAuthEmail } from "@/lib/auth/email";
import { isAdminUser } from "@/lib/auth/roles";
import { mergeChemicals, getApvForId, searchAll } from "@/lib/chemicals";
import { ensureMockRiskAssessmentsSeeded } from "@/lib/mock-risk-assessments";
import {
  deleteRiskAssessment,
  loadRiskAssessments,
  saveRiskAssessments,
} from "@/lib/risk-assessment-storage";
import type { ChemicalRiskAssessment } from "@/lib/risk-assessment-types";
import {
  deleteChemicalUploadFromSupabase,
  fetchChemicalUploadsFromSupabase,
  mergeChemicalUploads,
  upsertChemicalUploadToSupabase,
} from "@/lib/supabase/chemical-uploads-sync";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import {
  deleteRiskAssessmentFromSupabase,
  fetchRiskAssessmentsFromSupabase,
  mergeRiskAssessments,
  upsertRiskAssessmentToSupabase,
} from "@/lib/supabase/risk-assessments-sync";
import { addUpload, loadUploads, removeUpload, saveUploads } from "@/lib/storage";
import type { Chemical, ChemicalApv, StoredUpload } from "@/lib/types";

interface ChemicalStoreValue {
  hydrated: boolean;
  syncing: boolean;
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
  refreshFromCloud: () => Promise<void>;
}

const ChemicalStoreContext = createContext<ChemicalStoreValue | null>(null);

export function ChemicalStoreProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<StoredUpload[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<ChemicalRiskAssessment[]>(
    []
  );
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refreshFromCloud = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    const client = createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return;

    setSyncing(true);
    try {
      const authEmail = getAuthEmail(user);
      if (isAdminUser(authEmail, null)) {
        const localRAs = loadRiskAssessments();
        const localUploads = loadUploads();
        await Promise.all([
          ...localRAs.map((ra) =>
            upsertRiskAssessmentToSupabase(client, ra, user.id)
          ),
          ...localUploads.map((u) =>
            upsertChemicalUploadToSupabase(client, u, user.id)
          ),
        ]);
      }

      const [remoteRAs, remoteUploads] = await Promise.all([
        fetchRiskAssessmentsFromSupabase(client),
        fetchChemicalUploadsFromSupabase(client),
      ]);

      setRiskAssessments((prev) => {
        const merged = mergeRiskAssessments(prev, remoteRAs);
        saveRiskAssessments(merged);
        return merged;
      });

      setUploads((prev) => {
        const merged = mergeChemicalUploads(prev, remoteUploads);
        saveUploads(merged);
        return merged;
      });
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    ensureMockRiskAssessmentsSeeded();
    const localUploads = loadUploads();
    const localRAs = loadRiskAssessments();
    setUploads(localUploads);
    setRiskAssessments(localRAs);
    setHydrated(true);
    void refreshFromCloud();
  }, [refreshFromCloud]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const client = createClient();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      void refreshFromCloud();
    });

    return () => subscription.unsubscribe();
  }, [refreshFromCloud]);

  const allChemicals = useMemo(() => mergeChemicals(uploads), [uploads]);

  const addFromSds = useCallback((record: StoredUpload) => {
    addUpload(record);
    setUploads((prev) => [record, ...prev]);

    if (isSupabaseConfigured()) {
      void (async () => {
        const client = createClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        try {
          await upsertChemicalUploadToSupabase(client, record, user?.id);
        } catch {
          // localStorage er stadig gemt
        }
      })();
    }
  }, []);

  const deleteUpload = useCallback((id: string) => {
    removeUpload(id);
    setUploads((prev) => prev.filter((u) => u.chemical.id !== id));

    if (isSupabaseConfigured()) {
      void deleteChemicalUploadFromSupabase(createClient(), id);
    }
  }, []);

  const getChemicalById = useCallback(
    (id: string) => {
      const found = allChemicals.find((c) => c.id === id);
      if (found) return found;

      const published = riskAssessments.find(
        (a) => a.chemicalId === id && a.status === "publiceret"
      );
      if (published) return chemicalFromAssessment(published);
      return undefined;
    },
    [allChemicals, riskAssessments]
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

    if (isSupabaseConfigured()) {
      void (async () => {
        const client = createClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        try {
          await upsertRiskAssessmentToSupabase(client, updated, user?.id);

          if (updated.status === "publiceret") {
            const remote = await fetchRiskAssessmentsFromSupabase(client);
            setRiskAssessments((prev) => {
              const merged = mergeRiskAssessments(prev, remote);
              saveRiskAssessments(merged);
              return merged;
            });
          }
        } catch {
          // localStorage er stadig gemt
        }
      })();
    }
  }, []);

  const deleteRiskAssessmentById = useCallback((id: string) => {
    deleteRiskAssessment(id);
    setRiskAssessments((prev) => prev.filter((a) => a.id !== id));

    if (isSupabaseConfigured()) {
      void deleteRiskAssessmentFromSupabase(createClient(), id);
    }
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
      syncing,
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
      refreshFromCloud,
    }),
    [
      hydrated,
      syncing,
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
      refreshFromCloud,
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
