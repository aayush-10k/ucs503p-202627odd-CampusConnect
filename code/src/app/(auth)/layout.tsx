import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "CampusConnect — Authentication",
  description: "Sign in or register for your verified campus community account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 relative overflow-hidden bg-gradient-to-b from-rose-50/40 via-white to-slate-50 dark:from-[#0f0a14] dark:via-[#0b0710] dark:to-[#08050c] selection:bg-rose-500 selection:text-white">
      {/* Ambient background blur lights */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-rose-500/15 dark:bg-rose-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-400/5 dark:bg-rose-900/5 rounded-full blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Brand Header */}
      <header className="relative z-10 w-full max-w-md flex justify-start pt-2 sm:pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-rose-600 dark:text-rose-500 hover:opacity-85 transition-opacity"
          aria-label="CampusConnect Home"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-600/10 dark:bg-rose-500/20 flex items-center justify-center border border-rose-600/20">
            <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-xl tracking-tight font-[family-name:var(--font-heading)]">
            CampusConnect
          </span>
        </Link>
      </header>

      {/* Main card container */}
      <main className="relative z-10 w-full max-w-md my-auto py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 dark:text-slate-500 py-4 max-w-md">
        <p>© {new Date().getFullYear()} CampusConnect. Private academic network for verified campus members.</p>
      </footer>
    </div>
  );
}
