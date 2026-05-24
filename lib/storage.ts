import type { StoredUpload } from "./types";

const STORAGE_KEY = "kemisk-apv-uploads";

export function loadUploads(): StoredUpload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUpload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUploads(uploads: StoredUpload[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
}

export function addUpload(record: StoredUpload): void {
  saveUploads([record, ...loadUploads()]);
}

export function removeUpload(id: string): void {
  saveUploads(loadUploads().filter((u) => u.chemical.id !== id));
}
