"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ToastProvider, ToastViewport } from "@radix-ui/react-toast";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ToastProvider swipeDirection="right">
        {children}
        <ToastViewport className="toast-viewport" />
      </ToastProvider>
    </SessionProvider>
  );
}
