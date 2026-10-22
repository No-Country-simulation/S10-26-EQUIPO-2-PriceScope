import { describe, expect, it } from "vitest";
import {
  buildAlertsSearchParams,
  filterMockAlerts,
  getAlertsData,
  getAlertsMilestones,
} from "../../src/services/alerts.service";

describe("Alerts Service - buildAlertsSearchParams", () => {
  it("serializa correctamente los parámetros definidos omitiendo valores 'all'", () => {
    const params = {
      page: 2,
      limit: 25,
      fecha_desde: "2026-09-01",
      fecha_hasta: "2026-09-30",
      tienda_id: "carrefour",
      categoria_id: "all",
      severidad: "danger",
    };

    const searchParams = buildAlertsSearchParams(params);

    expect(searchParams.get("page")).toBe("2");
    expect(searchParams.get("limit")).toBe("25");
    expect(searchParams.get("fecha_desde")).toBe("2026-09-01");
    expect(searchParams.get("fecha_hasta")).toBe("2026-09-30");
    expect(searchParams.get("tienda_id")).toBe("carrefour");
    expect(searchParams.get("categoria_id")).toBeNull();
    expect(searchParams.get("severidad")).toBe("danger");
  });
});

describe("Alerts Service - filterMockAlerts y getAlertsData", () => {
  it("retorna el dataset completo mock cuando no hay filtros aplicados", () => {
    const response = filterMockAlerts({});
    expect(response.alertas.length).toBeGreaterThan(0);
    expect(response.paginacion.pagina_actual).toBe(1);
    expect(response.paginacion.total_registros).toBe(response.alertas.length);
  });

  it("filtra alertas por tienda de forma no sensitiva a mayúsculas", () => {
    const response = filterMockAlerts({ tienda_id: "jumbo" });
    expect(response.alertas.length).toBeGreaterThan(0);
    expect(response.alertas.every((a) => a.tienda_nombre.toLowerCase().includes("jumbo"))).toBe(
      true
    );
  });

  it("filtra alertas por categoría", () => {
    const response = filterMockAlerts({ categoria_id: "electro" });
    expect(response.alertas.length).toBeGreaterThan(0);
    expect(
      response.alertas.some(
        (a) =>
          a.producto_nombre.toLowerCase().includes("tv") ||
          a.producto_nombre.toLowerCase().includes("heladera")
      )
    ).toBe(true);
  });

  it("filtra alertas por severidad crítica (> 10 pts)", () => {
    const response = filterMockAlerts({ severidad: "danger" });
    expect(response.alertas.length).toBeGreaterThan(0);
    expect(response.alertas.every((a) => a.diferencial_puntos > 10.0)).toBe(true);
  });

  it("calcula paginación correctamente al especificar límites reducidos", () => {
    const response = filterMockAlerts({ page: 1, limit: 3 });
    expect(response.alertas).toHaveLength(3);
    expect(response.paginacion.pagina_actual).toBe(1);
    expect(response.paginacion.limite_por_pagina).toBe(3);
    expect(response.paginacion.total_paginas).toBe(
      Math.ceil(response.paginacion.total_registros / 3)
    );
  });

  it("getAlertsData resuelve una promesa válida con la estructura OpenAPI", async () => {
    const response = await getAlertsData({ limit: 4 });
    expect(response).toBeDefined();
    expect(response.paginacion).toBeDefined();
    expect(Array.isArray(response.alertas)).toBe(true);
    expect(response.alertas.length).toBeLessThanOrEqual(4);
  });
});

describe("Alerts Service - getAlertsMilestones", () => {
  it("obtiene la lista de hitos contextuales con sus atributos requeridos", async () => {
    const milestones = await getAlertsMilestones();
    expect(Array.isArray(milestones)).toBe(true);
    expect(milestones.length).toBeGreaterThanOrEqual(6);

    const first = milestones[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("tag");
    expect(first).toHaveProperty("date");
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("description");
    expect(first).toHaveProperty("variant");
  });
});
