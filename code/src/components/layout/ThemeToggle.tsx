"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateFromDOMOrStorage = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const stored = localStorage.getItem("theme");
      if (stored === "light" || (!stored && !isDark)) {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    };

    updateFromDOMOrStorage();

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<"light" | "dark">;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      } else {
        updateFromDOMOrStorage();
      }
    };

    window.addEventListener("theme-change", handleThemeChange);
    window.addEventListener("storage", updateFromDOMOrStorage);

    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
      window.removeEventListener("storage", updateFromDOMOrStorage);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // Broadcast change to other ThemeToggle instances
    window.dispatchEvent(new CustomEvent("theme-change", { detail: nextTheme }));
  };

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl border border-transparent ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      className={`relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${className}`}
      title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-slate-700 transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="w-5 h-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      )}
    </button>
  );
}
