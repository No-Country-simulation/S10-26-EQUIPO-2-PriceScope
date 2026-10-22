import type { Moneda, UnidadMedida } from "@/types/api";

const NULL_VALUE_PLACEHOLDER = "--";

const currencyFormatterARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currencyFormatterUSD = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formats a UTC ISO-8601 timestamp string into Argentina local time (ART = UTC-3).
 * Output format: `DD/MM/YYYY HH:mm ART`
 * If the input is null, undefined, empty, or invalid, returns `--`.
 */
export function formatTimestampToART(timestampUtc?: string | null): string {
  if (!timestampUtc) {
    return NULL_VALUE_PLACEHOLDER;
  }

  const date = new Date(timestampUtc);
  if (Number.isNaN(date.getTime())) {
    return NULL_VALUE_PLACEHOLDER;
  }

  const parts = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const day = getPart("day");
  const month = getPart("month");
  const year = getPart("year");
  const hour = getPart("hour");
  const minute = getPart("minute");

  return `${day}/${month}/${year} ${hour}:${minute} ART`;
}

/**
 * Formats a numeric currency value according to the specified currency code.
 * Supports "ARS" ($12.000,00) and "USD" / foreign currencies (US$ 10,00 or $10,00).
 * Returns `--` when the value is null, undefined, or NaN.
 */
export function formatCurrency(value: number | null | undefined, currency: Moneda = "ARS"): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return NULL_VALUE_PLACEHOLDER;
  }

  if (currency === "ARS") {
    return currencyFormatterARS.format(value);
  }

  return currencyFormatterUSD.format(value);
}

/**
 * Formats a unit price with its associated measurement unit, e.g. `$24.000,00/kg`.
 * Returns `--` when the value is null or undefined.
 */
export function formatUnitPrice(
  value: number | null | undefined,
  unit?: UnidadMedida | string | null
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return NULL_VALUE_PLACEHOLDER;
  }

  const formattedPrice = currencyFormatterARS.format(value);
  const resolvedUnit = unit ? `/${unit}` : "";

  return `${formattedPrice}${resolvedUnit}`;
}

/**
 * Helper to display nullable text or numbers with `--` fallback.
 */
export function formatNullableValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return NULL_VALUE_PLACEHOLDER;
  }
  return String(value);
}
