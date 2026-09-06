import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

/**
 * Combines multiple Tailwind / conditional class names into an optimized string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Date or ISO date string into a human-readable date.
 * E.g. "Oct 24, 2026" or custom format string.
 */
export function formatDate(date: Date | string | number, formatStr: string = "MMM d, yyyy"): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return format(d, formatStr);
}

/**
 * Formats a Date or ISO string into a relative "time ago" string.
 * E.g. "5 minutes ago", "2 hours ago", "yesterday".
 */
export function timeAgo(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Formats byte size into KB, MB, GB string for course materials and attachments.
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Generates user initials for fallback avatar icons.
 */
export function getInitials(name?: string | null): string {
  if (!name) return "CC";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
