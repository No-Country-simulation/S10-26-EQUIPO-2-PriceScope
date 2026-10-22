import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CSV_OBSERVATION_HEADERS,
  downloadCsvFile,
  escapeCsvField,
  generateTraceabilityCsv,
} from "../../src/lib/traceability/exportCsv";
import {
  formatCurrency,
  formatNullableValue,
  formatTimestampToART,
  formatUnitPrice,
} from "../../src/lib/traceability/formatters";
import {
  getStatusBadgeConfig,
  getStatusLabel,
  getStatusVariant,
} from "../../src/lib/traceability/status";
import {
  buildTraceabilitySearchParams,
  filterMockTraceability,
  getTraceabilityData,
} from "../../src/services/traceability.service";
import type { ObservacionTrazabilidadItem } from "../../src/types/api";

describe("formatters.ts - Formateo de fechas, monedas y valores nulos", () => {
  it("formatTimestampToART formatea marcas UTC a hora de Argentina (ART = UTC-3)", () => {
    // 14:30 UTC corresponde a 11:30 ART
    const formatted = formatTimestampToART("2026-10-17T14:30:00Z");
    expect(formatted).toBe("17/10/2026 11:30 ART");
  });

  it("formatTimestampToART maneja cruces de medianoche entre UTC y ART", () => {
    // 2026-10-18T01:15:00Z corresponde a 2026-10-17 22:15 ART
    const formatted = formatTimestampToART("2026-10-18T01:15:00Z");
    expect(formatted).toBe("17/10/2026 22:15 ART");
  });

  it("formatTimestampToART devuelve '--' ante null, undefined o cadenas inválidas", () => {
    expect(formatTimestampToART(null)).toBe("--");
    expect(formatTimestampToART(undefined)).toBe("--");
    expect(formatTimestampToART("")).toBe("--");
    expect(formatTimestampToART("cadena-invalida")).toBe("--");
  });

  it("formatCurrency formatea moneda ARS con separador de miles y sin ceros innecesarios", () => {
    const formatted = formatCurrency(12000.5, "ARS");
    expect(formatted).toContain("12.000,5");
    expect(formatted).toContain("$");

    const formattedInteger = formatCurrency(12000, "ARS");
    expect(formattedInteger).toContain("12.000");
    expect(formattedInteger).not.toContain(",00");
  });

  it("formatCurrency formatea moneda USD con símbolo o divisa correspondiente", () => {
    const formatted = formatCurrency(10.25, "USD");
    expect(formatted).toContain("10,25");
  });

  it("formatCurrency devuelve '--' ante valores nulos, undefined o NaN", () => {
    expect(formatCurrency(null, "ARS")).toBe("--");
    expect(formatCurrency(undefined, "ARS")).toBe("--");
    expect(formatCurrency(Number.NaN, "ARS")).toBe("--");
  });

  it("formatUnitPrice formatea el precio unitario anexando la unidad de medida", () => {
    const formattedKg = formatUnitPrice(24000, "kg");
    expect(formattedKg).toContain("24.000");
    expect(formattedKg).not.toContain(",00");
    expect(formattedKg).toContain("/kg");

    const formattedUnit = formatUnitPrice(850000, "unidad");
    expect(formattedUnit).toContain("850.000");
    expect(formattedUnit).not.toContain(",00");
    expect(formattedUnit).toContain("/unidad");
  });

  it("formatUnitPrice omite la barra de unidad si esta es null o undefined", () => {
    const formattedWithoutUnit = formatUnitPrice(1500, null);
    expect(formattedWithoutUnit).toContain("1.500");
    expect(formattedWithoutUnit).not.toContain(",00");
    expect(formattedWithoutUnit).not.toContain("/");
  });

  it("formatUnitPrice devuelve '--' ante precios nulos o no numéricos", () => {
    expect(formatUnitPrice(null, "kg")).toBe("--");
    expect(formatUnitPrice(undefined, "kg")).toBe("--");
    expect(formatUnitPrice(Number.NaN, "kg")).toBe("--");
  });

  it("formatNullableValue devuelve '--' ante null, undefined o string vacío, y string del valor si existe", () => {
    expect(formatNullableValue(null)).toBe("--");
    expect(formatNullableValue(undefined)).toBe("--");
    expect(formatNullableValue("")).toBe("--");
    expect(formatNullableValue("CAR-12345")).toBe("CAR-12345");
    expect(formatNullableValue(42)).toBe("42");
  });
});

describe("status.ts - Mapeo de estados EstadoDato a variantes y etiquetas", () => {
  it("mapea DATO_VALIDO a variante success y etiqueta 'Dato Válido'", () => {
    expect(getStatusVariant("DATO_VALIDO")).toBe("success");
    expect(getStatusLabel("DATO_VALIDO")).toBe("Dato Válido");
    const config = getStatusBadgeConfig("DATO_VALIDO");
    expect(config.description).toContain("consistencia matemática");
  });

  it("mapea AGOTADO a variante warning y etiqueta 'Agotado'", () => {
    expect(getStatusVariant("AGOTADO")).toBe("warning");
    expect(getStatusLabel("AGOTADO")).toBe("Agotado");
    const config = getStatusBadgeConfig("AGOTADO");
    expect(config.description).toContain("stock disponible");
  });

  it("mapea ERROR_CAPTURA a variante error y etiqueta 'Error Captura'", () => {
    expect(getStatusVariant("ERROR_CAPTURA")).toBe("error");
    expect(getStatusLabel("ERROR_CAPTURA")).toBe("Error Captura");
    const config = getStatusBadgeConfig("ERROR_CAPTURA");
    expect(config.description).toContain("timeout");
  });

  it("mapea SIN_DATO a variante neutral y etiqueta 'Sin Dato'", () => {
    expect(getStatusVariant("SIN_DATO")).toBe("neutral");
    expect(getStatusLabel("SIN_DATO")).toBe("Sin Dato");
    const config = getStatusBadgeConfig("SIN_DATO");
    expect(config.description).toContain("discontinuidad");
  });

  it("provee fallback seguro ante estados desconocidos", () => {
    const fallbackConfig = getStatusBadgeConfig("ESTADO_DESCONOCIDO");
    expect(fallbackConfig.variant).toBe("neutral");
    expect(fallbackConfig.label).toBe("ESTADO_DESCONOCIDO");

    expect(getStatusVariant("OTRO")).toBe("neutral");
    expect(getStatusLabel("OTRO")).toBe("OTRO");
  });
});

describe("exportCsv.ts - Conformidad con RFC 4180 y generación de observaciones", () => {
  it("escapeCsvField escapa comas, comillas dobles y saltos de línea según RFC 4180", () => {
    expect(escapeCsvField("Texto simple")).toBe("Texto simple");
    expect(escapeCsvField("Texto, con comas")).toBe('"Texto, con comas"');
    expect(escapeCsvField('Texto "con comillas"')).toBe('"Texto ""con comillas"""');
    expect(escapeCsvField("Línea 1\nLínea 2")).toBe('"Línea 1\nLínea 2"');
    expect(escapeCsvField("Línea 1\r\nLínea 2")).toBe('"Línea 1\r\nLínea 2"');
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
    expect(escapeCsvField(1234)).toBe("1234");
  });

  it("generateTraceabilityCsv incluye cabeceras oficiales y formato CRLF", () => {
    const csv = generateTraceabilityCsv([]);
    const lines = csv.split("\r\n");

    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(CSV_OBSERVATION_HEADERS.join(","));
    expect(lines[0]).toContain("Fecha y Hora (ART)");
    expect(lines[0]).toContain("URL Origen");
  });

  it("generateTraceabilityCsv serializa observaciones con valores formateados y valores faltantes", () => {
    const mockObs: ObservacionTrazabilidadItem[] = [
      {
        timestamp_utc: "2026-10-17T14:30:00Z",
        tienda_id: "carrefour",
        tienda_nombre: "Carrefour, Sucursal Centro",
        url_origen: "https://www.carrefour.com.ar/item-1",
        sku_tienda: "SKU-001",
        alias_producto: 'Café "Especial" 500g',
        precio_regular: 12000.5,
        precio_promocional: 11000.0,
        precio_por_unidad: 24001.0,
        unidad_medida: "kg",
        precio_usd: 10.0,
        estado_dato: "DATO_VALIDO",
        cotizacion_aplicada: 1200.0,
        cotizacion_aproximada: false,
        fuente_cotizacion: "DolarAPI_Cierre",
        motivo_faltante: null,
      },
      {
        timestamp_utc: "2026-10-14T14:30:00Z",
        tienda_id: "carrefour",
        tienda_nombre: "Carrefour",
        url_origen: "https://www.carrefour.com.ar/item-2",
        sku_tienda: null,
        alias_producto: "Café Clásico",
        precio_regular: null,
        precio_promocional: null,
        precio_por_unidad: null,
        unidad_medida: "kg",
        precio_usd: null,
        estado_dato: "AGOTADO",
        cotizacion_aplicada: null,
        cotizacion_aproximada: true,
        fuente_cotizacion: null,
        motivo_faltante: "Sin stock en góndola digital (RN-04)",
      },
    ];

    const csv = generateTraceabilityCsv(mockObs);
    const lines = csv.split("\r\n");

    expect(lines).toHaveLength(3);

    // Fila 1: escapes con comillas dobles y comas en tienda y alias
    expect(lines[1]).toContain('"Carrefour, Sucursal Centro"');
    expect(lines[1]).toContain('"Café ""Especial"" 500g"');
    expect(lines[1]).toContain("12000.50");
    expect(lines[1]).toContain("11000.00");
    expect(lines[1]).toContain("Dato Válido");
    expect(lines[1]).toContain("NO"); // cotizacion_aproximada false

    // Fila 2: valores nulos reflejados como vacíos y cotización aproximada SÍ
    expect(lines[2]).toContain("Agotado");
    expect(lines[2]).toContain("SÍ");
    expect(lines[2]).toContain("Sin stock en góndola digital (RN-04)");
  });

  it("downloadCsvFile no produce errores en entorno sin window/document", () => {
    expect(() => downloadCsvFile("test,csv", "archivo.csv")).not.toThrow();
  });
});

describe("traceability.service.ts - Serialización de parámetros y conmutación Mock / API", () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it("buildTraceabilitySearchParams serializa parámetros y omite 'all' o vacíos", () => {
    const params = {
      tienda_id: "carrefour",
      fecha_desde: "2026-10-01",
      fecha_hasta: "2026-10-15",
    };

    const searchParams = buildTraceabilitySearchParams(params);
    expect(searchParams.get("tienda_id")).toBe("carrefour");
    expect(searchParams.get("fecha_desde")).toBe("2026-10-01");
    expect(searchParams.get("fecha_hasta")).toBe("2026-10-15");

    const omittedParams = buildTraceabilitySearchParams({ tienda_id: "all" });
    expect(omittedParams.get("tienda_id")).toBeNull();
  });

  it("filterMockTraceability resuelve producto por ID o slug y aplica filtros", () => {
    const byId = filterMockTraceability("b3e21a88-7f2c-4b55-89df-1c0a2f4d6e90");
    expect(byId).not.toBeNull();
    expect(byId?.producto.slug).toBe("prod-cafe-la-virginia-500g");

    const bySlug = filterMockTraceability("prod-cafe-la-virginia-500g");
    expect(bySlug).not.toBeNull();
    expect(bySlug?.producto.id).toBe("b3e21a88-7f2c-4b55-89df-1c0a2f4d6e90");

    // Filtrar por rango de fechas
    const filteredByDate = filterMockTraceability("prod-cafe-la-virginia-500g", {
      fecha_desde: "2026-10-15",
      fecha_hasta: "2026-10-16",
    });
    expect(filteredByDate).not.toBeNull();
    expect(filteredByDate?.historico_observaciones.length).toBe(2);

    // Producto inexistente
    const notFound = filterMockTraceability("producto-inexistente");
    expect(notFound).toBeNull();
  });

  it("getTraceabilityData consume mock local cuando NEXT_PUBLIC_API_URL no está definida", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    const data = await getTraceabilityData("prod-cafe-la-virginia-500g");
    expect(data).toBeDefined();
    expect(data.producto.marca).toBe("La Virginia");
    expect(data.historico_observaciones.length).toBeGreaterThan(0);
  });

  it("getTraceabilityData arroja error cuando el producto no se encuentra en el mock", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    await expect(getTraceabilityData("no-existe")).rejects.toThrow(
      'Producto con ID o slug "no-existe" no encontrado en catálogo mock.'
    );
  });

  it("getTraceabilityData realiza petición fetch a NEXT_PUBLIC_API_URL cuando está configurada", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.pricescope.ar";

    const mockResponsePayload = {
      producto: {
        id: "prod-remote-1",
        slug: "prod-remoto",
        nombre_normalizado: "Producto Remoto Test",
        marca: "Remota",
        modelo: null,
        categoria: "Test",
        contenido_neto_valor: 1,
        contenido_neto_unidad: "kg",
        pack: "x1",
      },
      historico_observaciones: [],
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponsePayload,
    } as Response);

    const result = await getTraceabilityData("prod-remote-1", { tienda_id: "coto" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.pricescope.ar/api/v1/products/prod-remote-1/traceability?tienda_id=coto",
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );
    expect(result.producto.id).toBe("prod-remote-1");
  });

  it("getTraceabilityData lanza error descriptivo si la API remota responde con error HTTP", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.pricescope.ar";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(getTraceabilityData("prod-not-found")).rejects.toThrow(
      "Error en traceability API (404 Not Found)"
    );
  });
});
