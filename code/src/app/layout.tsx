import type { Metadata } from "next";
import "./globals.css";

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
        {/* SessionProvider and Toasts will be added in Phase 3 */}
        {children}
      </body>
    </html>
  );
}
