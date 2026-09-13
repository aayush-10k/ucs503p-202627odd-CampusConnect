import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "CampusConnect — Closed-Community Academic & Social Platform",
  description:
    "A private, verified, and role-aware academic networking platform for educational institutions. Connect with peers, access course materials, and collaborate securely within your campus community.",
  keywords: ["campus", "academic", "social network", "education", "TIET", "college"],
  authors: [
    { name: "Prakhar Saxena" },
    { name: "Aayushmaan Singh Meyan" },
    { name: "Divyansh Jasrotia" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          {children}
        </Providers>
        <style>{`
          /* ── Radix Toast Viewport ──────────────────────── */
          .toast-viewport {
            position: fixed;
            bottom: var(--space-6);
            right: var(--space-6);
            display: flex;
            flex-direction: column;
            gap: var(--space-3);
            width: 360px;
            max-width: calc(100vw - var(--space-8));
            z-index: 9999;
            outline: none;
            list-style: none;
            padding: 0;
            margin: 0;
          }
        `}</style>
      </body>
    </html>
  );
}
