import { describe, expect, it } from "vitest";
import {
  buildAlertsCsv,
  classifySeverity,
  formatCurrencyARS,
  formatSignedPercentage,
  formatSignedPoints,
  getSeverityBadgeVariant,
  mapAlertToTableRow,
} from "../../src/lib/alerts";
import type { AlertaItem } from "../../src/types/api";

describe("Alerts Pure Logic - severity.ts", () => {
  it("clasifica severidad determinísticamente según los umbrales de divergencia", () => {
    expect(classifySeverity(10.1)).toBe("danger");
    expect(classifySeverity(25.0)).toBe("danger");
    expect(classifySeverity(10.0)).toBe("warning");
    expect(classifySeverity(5.0)).toBe("warning");
    expect(classifySeverity(7.5)).toBe("warning");
    expect(classifySeverity(4.9)).toBe("info");
    expect(classifySeverity(0)).toBe("info");
    expect(classifySeverity(-3.5)).toBe("info");
  });

  it("asigna la variante cromática del Badge correctamente", () => {
    expect(getSeverityBadgeVariant(15.0)).toBe("error");
    expect(getSeverityBadgeVariant(7.5)).toBe("warning");
    expect(getSeverityBadgeVariant(2.0)).toBe("default");

    expect(getSeverityBadgeVariant("danger")).toBe("error");
    expect(getSeverityBadgeVariant("warning")).toBe("warning");
    expect(getSeverityBadgeVariant("info")).toBe("default");
    expect(getSeverityBadgeVariant("all")).toBe("default");
  });
});

describe("Alerts Pure Logic - formatters.ts", () => {
  it("formatea porcentajes con signo y un decimal", () => {
    expect(formatSignedPercentage(25.0)).toBe("+25.0%");
    expect(formatSignedPercentage(18.5)).toBe("+18.5%");
    expect(formatSignedPercentage(-4.2)).toBe("-4.2%");
    expect(formatSignedPercentage(0)).toBe("0.0%");
  });

  it("formatea puntos diferenciales con signo", () => {
    expect(formatSignedPoints(10.5)).toBe("+10.5 pts");
    expect(formatSignedPoints(5.0)).toBe("+5.0 pts");
    expect(formatSignedPoints(-1.2)).toBe("-1.2 pts");
    expect(formatSignedPoints(0)).toBe("0.0 pts");
  });

  it("formatea valores monetarios en ARS con separador de miles", () => {
    expect(formatCurrencyARS(1200)).toBe("$1.200");
    expect(formatCurrencyARS(920)).toBe("$920");
    expect(formatCurrencyARS(1185)).toBe("$1.185");
  });

  it("transforma un AlertaItem del backend a AlertTableRowView", () => {
    const alert: AlertaItem = {
      alerta_id: "alt-001",
      producto_canonico_id: "prod-1",
      producto_nombre: "Aceite de girasol puro 1.5L",
      tienda_nombre: "Jumbo",
      periodo: {
        inicio_utc: "2026-09-19T00:00:00Z",
        fin_utc: "2026-10-18T00:00:00Z",
      },
      variacion_precio_pct: 18.5,
      variacion_cotizacion_pct: 8.0,
      diferencial_puntos: 10.5,
      cotizacion_usada_cierre: 920.0,
      cobertura_pct: 100.0,
      regla_faltantes: "LOCF",
      tipo_alerta: "PRECIO_SUPERA_DEVALUACION",
    };

    const row = mapAlertToTableRow(alert);
    expect(row.id).toBe("alt-001");
    expect(row.store).toBe("Jumbo");
    expect(row.varPrice).toBe("+18.5%");
    expect(row.varUsd).toBe("+8.0%");
    expect(row.delta).toBe("+10.5 pts");
    expect(row.deltaType).toBe("error");
    expect(row.rateValue).toBe("$920");
    expect(row.rateType).toBe("Oficial");
    expect(row.isApprox).toBe(false);
    expect(row.category).toBe("Almacén");
  });
});

describe("Alerts Pure Logic - exportAlerts.ts (RFC 4180)", () => {
  it("genera un archivo CSV cumpliendo el estándar RFC 4180", () => {
    const alerts: AlertaItem[] = [
      {
        alerta_id: "alt-1",
        producto_canonico_id: "p-1",
        producto_nombre: 'Smart TV 55" 4K UHD, Especial',
        tienda_nombre: "Frávega",
        periodo: {
          inicio_utc: "2026-09-19T00:00:00Z",
          fin_utc: "2026-10-18T00:00:00Z",
        },
        variacion_precio_pct: 45.0,
        variacion_cotizacion_pct: 20.0,
        diferencial_puntos: 25.0,
        cotizacion_usada_cierre: 1185.0,
        cobertura_pct: 96.7,
        regla_faltantes: "LOCF",
        tipo_alerta: "PRECIO_SUPERA_DEVALUACION",
      },
    ];

    const csv = buildAlertsCsv(alerts);
    const lines = csv.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("alerta_id,producto_canonico_id,producto_nombre");
    expect(lines[1]).toContain('"Smart TV 55"" 4K UHD, Especial"');
  });
});
