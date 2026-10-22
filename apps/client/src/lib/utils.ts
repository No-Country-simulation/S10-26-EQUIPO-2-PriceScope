// Tremor Raw cx [v0.0.0]

import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionales de `clsx` y resuelve conflictos de utilidades de Tailwind CSS con `twMerge`.
 */
export function cx(...args: ClassValue[]) {
  return twMerge(clsx(...args));
}

// Tremor focusInput [v0.0.2]

export const focusInput = [
  "focus:outline-none",
  "focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20",
  "data-[state=open]:border-blue-500 data-[state=open]:ring-2 data-[state=open]:ring-blue-500/20",
];

// Tremor Raw focusRing [v0.0.1]

export const focusRing = [
  // base
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  // outline color
  "outline-blue-500 dark:outline-blue-500",
];

// Tremor Raw hasErrorInput [v0.0.1]

export const hasErrorInput = [
  // base
  "ring-2",
  // border color
  "border-red-500 dark:border-red-700",
  // ring color
  "ring-red-200 dark:ring-red-700/30",
];
