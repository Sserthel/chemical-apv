import type { Metadata, Viewport } from "next";
import { AuthStatusBar } from "@/components/AuthStatusBar";
import { BottomNav } from "@/components/BottomNav";
import { Providers } from "@/components/Providers";
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
        <Providers>
          <AuthStatusBar />
          <main className="mx-auto min-h-screen max-w-lg">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
