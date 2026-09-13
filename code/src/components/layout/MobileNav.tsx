"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Users, BookOpen, Calendar, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const navItems = [
    { label: "Feed", href: "/feed", icon: Home },
    { label: "Friends", href: "/friends", icon: Users },
    { label: "Groups", href: "/groups", icon: BookOpen },
    { label: "Schedule", href: "/schedule", icon: Calendar },
    { label: "Profile", href: user?.id ? `/profile/${user.id}` : "/login", icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg shadow-black/5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-xs font-semibold transition-colors",
              isActive
                ? "text-rose-600 dark:text-rose-500"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
