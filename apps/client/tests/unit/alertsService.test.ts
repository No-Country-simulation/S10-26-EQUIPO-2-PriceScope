import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAlertsSearchParams,
  getAlertsData,
  getAlertsMilestones,
} from "../../src/services/alerts.service";
import type { AlertsResponse } from "../../src/types/api";

const mockResponse: AlertsResponse = {
  paginacion: {
    pagina_actual: 1,
    limite_por_pagina: 50,
    total_registros: 2,
    total_paginas: 1,
  },
  alertas: [
    {
      alerta_id: "alt-20261108-001",
      producto_canonico_id: "05f3c7d2-77c2-4e71-953d-de677ecb985f",
      producto_nombre: "Mayonesa NATURA Pouch 475 Gr",
      tienda_nombre: "Jumbo Argentina",
      periodo: {
        inicio_utc: "2026-10-09T22:08:42.710Z",
        fin_utc: "2026-11-07T22:08:42.710Z",
      },
      variacion_precio_pct: 41.7,
      variacion_cotizacion_pct: 18.8,
      diferencial_puntos: 22.9,
      cotizacion_usada_cierre: 1431.75,
      cobertura_pct: 100,
      regla_faltantes: "LOCF",
      tipo_alerta: "PRECIO_SUPERA_DEVALUACION",
    },
    {
      alerta_id: "alt-20261108-002",
      producto_canonico_id: "05f3c7d2-77c2-4e71-953d-de677ecb985f",
      producto_nombre: "Heladera Samsung RT29",
      tienda_nombre: "Disco Argentina",
      periodo: {
        inicio_utc: "2026-10-09T22:08:42.710Z",
        fin_utc: "2026-11-07T22:08:42.710Z",
      },
      variacion_precio_pct: 24.5,
      variacion_cotizacion_pct: 18.8,
      diferencial_puntos: 5.7,
      cotizacion_usada_cierre: 1431.75,
      cobertura_pct: 95,
      regla_faltantes: "LOCF",
      tipo_alerta: "PRECIO_SUPERA_DEVALUACION",
    },
  ],
};

describe("Alerts Service - buildAlertsSearchParams", () => {
  it("serializa correctamente los parámetros definidos omitiendo valores 'all'", () => {
    const params = {
      page: 2,
      limit: 25,
      fecha_desde: "2026-09-01",
      fecha_hasta: "2026-09-30",
      tienda_id: "jumbo",
      categoria_id: "all",
      severidad: "danger",
    };

    const searchParams = buildAlertsSearchParams(params);

    expect(searchParams.get("page")).toBe("2");
    expect(searchParams.get("limit")).toBe("25");
    expect(searchParams.get("fecha_desde")).toBe("2026-09-01");
    expect(searchParams.get("fecha_hasta")).toBe("2026-09-30");
    expect(searchParams.get("tienda_id")).toBe("jumbo");
    expect(searchParams.get("categoria_id")).toBeNull();
    expect(searchParams.get("severidad")).toBe("danger");
  });
});

describe("Alerts Service - getAlertsData y getAlertsMilestones con API real", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getAlertsData resuelve una respuesta tipada válida contra la API", async () => {
    const response = await getAlertsData({ limit: 4 });
    expect(response).toBeDefined();
    expect(response.paginacion.total_registros).toBe(2);
    expect(response.alertas).toHaveLength(2);
    expect(response.alertas[0].producto_nombre).toBe("Mayonesa NATURA Pouch 475 Gr");
  });

  it("getAlertsMilestones mapea las alertas recibidas a hitos formateados", async () => {
    const milestones = await getAlertsMilestones();
    expect(Array.isArray(milestones)).toBe(true);
    expect(milestones).toHaveLength(2);

    const first = milestones[0];
    expect(first.title).toBe("Mayonesa NATURA Pouch 475 Gr");
    expect(first.tag).toBe("Divergencia Extrema");
    expect(first.variant).toBe("error");
  });

  it("lanza un error explicativo cuando NEXT_PUBLIC_API_URL no está configurada", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    try {
      await expect(getAlertsData()).rejects.toThrow(
        "NEXT_PUBLIC_API_URL no está configurada en las variables de entorno."
      );
    } finally {
      process.env.NEXT_PUBLIC_API_URL = originalUrl;
    }
  });
});
