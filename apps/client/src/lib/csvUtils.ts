/**
 * Utilidades puras transversales para generación y descarga de archivos CSV (RFC 4180).
 */

/**
 * Escapa un campo individual según las normas RFC 4180:
 * - Envuelve entre comillas si contiene comas, comillas dobles, saltos de línea (\n) o retornos (\r).
 * - Duplica las comillas dobles internas ("").
 */
export function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Dispara la descarga de un archivo de texto/CSV agregando BOM UTF-8 (\uFEFF)
 * para correcta visualización en Microsoft Excel y software de analítica.
 * Protegido contra entornos SSR / Node donde document no está disponible.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = "text/csv;charset=utf-8;"
): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
