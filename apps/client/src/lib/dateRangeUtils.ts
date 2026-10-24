import {
  differenceInCalendarDays,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  subDays,
} from "date-fns";
import type { DateRange } from "react-day-picker";

export type { DateRange };

export interface DateRangePreset {
  label: string;
  dateRange: {
    from: Date;
    to: Date;
  };
}

/**
 * Formatea una fecha a cadena ISO (yyyy-MM-dd) para consumo en APIs.
 */
export function formatDateForApi(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

/**
 * Genera la lista de rangos preestablecidos para PriceScope relativos a una fecha.
 */
export function getPriceScopePresets(referenceDate: Date = new Date()): DateRangePreset[] {
  const today = endOfDay(referenceDate);
  const buildPreset = (label: string, days: number): DateRangePreset => ({
    label,
    dateRange: {
      from: startOfDay(subDays(today, days - 1)),
      to: today,
    },
  });

  return [
    buildPreset("Última semana (7D)", 7),
    buildPreset("Últimos 15 días (15D)", 15),
    buildPreset("Últimos 30 días (30D)", 30),
    buildPreset("Últimos 2 meses (60D)", 60),
    buildPreset("Últimos 3 meses (90D)", 90),
    buildPreset("Últimos 6 meses (180D)", 180),
    buildPreset("Últimos 9 meses (270D)", 270),
    buildPreset("Último año (1A)", 365),
  ];
}

/**
 * Calcula la cantidad de días calendario comprendidos en un rango de fechas.
 */
export function calculateRangeDayCount(range: DateRange | undefined): number | null {
  if (!range?.from) return null;
  if (!range.to) return 1;
  return Math.max(1, differenceInCalendarDays(range.to, range.from) + 1);
}

/**
 * Formatea la etiqueta descriptiva del rango de fechas para la interfaz de usuario.
 */
export function formatDateRangeLabel(range: DateRange | undefined, placeholder: string): string {
  if (!range?.from) return placeholder;
  if (!range.to) return format(range.from, "dd/MM/yyyy");
  const days = calculateRangeDayCount(range) ?? 1;
  return `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")} (${days}d)`;
}

/**
 * Determina si el rango de fechas actual coincide con un preset dado.
 */
export function isPresetRangeMatch(range: DateRange | undefined, preset: DateRangePreset): boolean {
  if (!range?.from || !range?.to) return false;
  return isSameDay(range.from, preset.dateRange.from) && isSameDay(range.to, preset.dateRange.to);
}

export {
  useDateRangeDraft,
  type UseDateRangeDraftParams,
  type UseDateRangeDraftReturn,
} from "@/hooks/useDateRangeDraft";
