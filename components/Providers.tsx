"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ChemicalStoreProvider } from "@/context/ChemicalStoreContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChemicalStoreProvider>{children}</ChemicalStoreProvider>
    </AuthProvider>
  );
}
