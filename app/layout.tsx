import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import { ChemicalStoreProvider } from "@/context/ChemicalStoreContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kemisk APV",
  description: "Kemisk arbejdspladsvurdering og sikkerhedsdatablade",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f2d4a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className="min-h-screen pb-24">
        <ChemicalStoreProvider>
          <main className="mx-auto min-h-screen max-w-lg">{children}</main>
          <BottomNav />
        </ChemicalStoreProvider>
      </body>
    </html>
  );
}
