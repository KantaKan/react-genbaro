import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The type ramp tokens in tailwind.config.js; without this, twMerge reads text-micro as a colour and drops it.
const twMerge = extendTailwindMerge({ extend: { classGroups: { "font-size": [{ text: ["micro", "small", "body", "title", "heading"] }] } } });

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
}

export function cd(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
