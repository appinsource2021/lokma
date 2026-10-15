import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { AppStateProvider } from "@/lib/state";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lokma — food delivery",
  description: "Order from restaurants near you. Open source.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#14463b" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppStateProvider>
          <Header />
          <main className="container">{children}</main>
        </AppStateProvider>
      </body>
    </html>
  );
}
