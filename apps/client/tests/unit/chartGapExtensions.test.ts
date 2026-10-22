import { describe, expect, it } from "vitest";
import {
  extendPointsToGapBoundaries,
  type ChartCoordinate,
} from "../../src/lib/dashboard/chartGapExtensions";

describe("extendPointsToGapBoundaries - Extensión de líneas a huecos y extremos exteriores", () => {
  it("debe extender los extremos exteriores hacia los bordes del gráfico cuando extendEdges es true", () => {
    // 3 puntos continuos con slotWidth = 10
    const points: ChartCoordinate[] = [
      { x: 10, y: 100 },
      { x: 20, y: 105 },
      { x: 30, y: 110 },
    ];
    const result = extendPointsToGapBoundaries(points, false, true);

    // Debe extender a la izquierda: 10 - 5 = 5 (con y = 100)
    // y a la derecha: 30 + 5 = 35 (con y = 110)
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ x: 5, y: 100 });
    expect(result[1]).toEqual({ x: 10, y: 100 });
    expect(result[2]).toEqual({ x: 20, y: 105 });
    expect(result[3]).toEqual({ x: 30, y: 110 });
    expect(result[4]).toEqual({ x: 35, y: 110 });
  });

  it("debe extender también los extremos exteriores en Modo Continuo (connectNulls = true)", () => {
    const points: ChartCoordinate[] = [
      { x: 10, y: 100 },
      { x: 20, y: null },
      { x: 30, y: 120 },
    ];
    const result = extendPointsToGapBoundaries(points, true, true);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ x: 5, y: 100 });
    expect(result[4]).toEqual({ x: 35, y: 120 });
  });

  it("en Modo Continuo, debe dibujar la línea sobre el recuadro cuando la serie comienza con puntos nulos", () => {
    // Días 0 y 1 nulos (recuadro inicial), Día 2 válido con y = 150, Día 3 válido con y = 160
    const points: ChartCoordinate[] = [
      { x: 10, y: null },
      { x: 20, y: null },
      { x: 30, y: 150 },
      { x: 40, y: 160 },
    ];

    const result = extendPointsToGapBoundaries(points, true, true);

    // Debe extender hasta el extremo izquierdo (10 - 5 = 5) con el primer valor válido y = 150
    expect(result[0]).toEqual({ x: 5, y: 150 });
    // Los días nulos iniciales deben tener y = 150 para que la línea se dibuje sobre el recuadro
    expect(result[1]).toEqual({ x: 10, y: 150 });
    expect(result[2]).toEqual({ x: 20, y: 150 });
    // Día 2 original
    expect(result[3]).toEqual({ x: 30, y: 150 });
    // Día 3 original
    expect(result[4]).toEqual({ x: 40, y: 160 });
    // Extremo derecho exterior
    expect(result[5]).toEqual({ x: 45, y: 160 });
  });

  it("en Modo Continuo, debe dibujar la línea sobre el recuadro cuando la serie termina con puntos nulos", () => {
    // Día 0 válido con y = 100, Día 1 válido con y = 110, Días 2 y 3 nulos (recuadro final)
    const points: ChartCoordinate[] = [
      { x: 10, y: 100 },
      { x: 20, y: 110 },
      { x: 30, y: null },
      { x: 40, y: null },
    ];

    const result = extendPointsToGapBoundaries(points, true, true);

    // Extremo izquierdo exterior
    expect(result[0]).toEqual({ x: 5, y: 100 });
    expect(result[1]).toEqual({ x: 10, y: 100 });
    expect(result[2]).toEqual({ x: 20, y: 110 });
    // Los días nulos finales deben tener y = 110 (LOCF) para que la línea se dibuje sobre el recuadro final
    expect(result[3]).toEqual({ x: 30, y: 110 });
    expect(result[4]).toEqual({ x: 40, y: 110 });
    // Extremo derecho exterior (40 + 5 = 45 con y = 110)
    expect(result[5]).toEqual({ x: 45, y: 110 });
  });

  it("en Modo Continuo, debe dibujar sobre ambos recuadros si inicia y termina con puntos nulos", () => {
    const points: ChartCoordinate[] = [
      { x: 10, y: null },
      { x: 20, y: 200 },
      { x: 30, y: null },
    ];

    const result = extendPointsToGapBoundaries(points, true, true);

    expect(result[0]).toEqual({ x: 5, y: 200 });
    expect(result[1]).toEqual({ x: 10, y: 200 });
    expect(result[2]).toEqual({ x: 20, y: 200 });
    expect(result[3]).toEqual({ x: 30, y: 200 });
    expect(result[4]).toEqual({ x: 35, y: 200 });
  });

  it("no debe agregar puntos si extendEdges es false y no hay puntos nulos", () => {
    const points: ChartCoordinate[] = [
      { x: 10, y: 100 },
      { x: 20, y: 105 },
      { x: 30, y: 110 },
    ];
    const result = extendPointsToGapBoundaries(points, false, false);
    expect(result).toHaveLength(3);
    expect(result).toEqual(points);
  });

  it("debe extender tanto los huecos internos como los extremos exteriores ante un hueco de 1 día", () => {
    // Día 0 (válido): x = 10, y = 100
    // Día 1 (nulo): x = 20, y = null -> recuadro entre x=15 y x=25
    // Día 2 (válido): x = 30, y = 110
    const points: ChartCoordinate[] = [
      { x: 10, y: 100 },
      { x: 20, y: null },
      { x: 30, y: 110 },
    ];

    const result = extendPointsToGapBoundaries(points, false, true);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ x: 5, y: 100 });
    expect(result[1]).toEqual({ x: 10, y: 100 });
    expect(result[2]).toEqual({ x: 15, y: 100 });
    expect(result[3]).toEqual({ x: 20, y: null });
    expect(result[4]).toEqual({ x: 25, y: 110 });
    expect(result[5]).toEqual({ x: 30, y: 110 });
    expect(result[6]).toEqual({ x: 35, y: 110 });
  });

  it("debe extender la línea hasta los bordes del recuadro ante un hueco multidiario (Agotado de 3 días)", () => {
    // Días 0..1 válidos, Días 2..4 nulos (Agotado), Día 5 válido
    const points: ChartCoordinate[] = [
      { x: 10, y: 100 },
      { x: 20, y: 105 },
      { x: 30, y: null },
      { x: 40, y: null },
      { x: 50, y: null },
      { x: 60, y: 120 },
    ];

    const result = extendPointsToGapBoundaries(points, false, true);

    // Extremo exterior izquierdo: 10 - 5 = 5
    expect(result[0]).toEqual({ x: 5, y: 100 });

    // Borde izquierdo del recuadro: (20 + 30) / 2 = 25 con y = 105
    // Borde derecho del recuadro: (50 + 60) / 2 = 55 con y = 120
    const borderLeft = result.find((p) => p.x === 25);
    const borderRight = result.find((p) => p.x === 55);

    expect(borderLeft).toBeDefined();
    expect(borderLeft?.y).toBe(105);

    expect(borderRight).toBeDefined();
    expect(borderRight?.y).toBe(120);

    // Extremo exterior derecho: 60 + 5 = 65
    expect(result[result.length - 1]).toEqual({ x: 65, y: 120 });
  });

  it("debe conectar correctamente si el primer día es nulo", () => {
    const points: ChartCoordinate[] = [
      { x: 10, y: null },
      { x: 20, y: 100 },
      { x: 30, y: 105 },
    ];

    const result = extendPointsToGapBoundaries(points, false, true);
    // Posición 0: punto nulo original (no se extiende hacia la izquierda en modo estricto)
    expect(result[0]).toEqual({ x: 10, y: null });
    // Posición 1: Borde derecho del día nulo: (10 + 20) / 2 = 15 con y = 100
    expect(result[1]).toEqual({ x: 15, y: 100 });
    // Posición 2: punto válido original
    expect(result[2]).toEqual({ x: 20, y: 100 });
    // Extremo derecho exterior: 30 + 5 = 35 con y = 105
    expect(result[result.length - 1]).toEqual({ x: 35, y: 105 });
  });

  it("debe conectar correctamente si el último día es nulo", () => {
    const points: ChartCoordinate[] = [
      { x: 10, y: 100 },
      { x: 20, y: 105 },
      { x: 30, y: null },
    ];

    const result = extendPointsToGapBoundaries(points, false, true);
    // Extremo izquierdo exterior: 10 - 5 = 5 con y = 100
    expect(result[0]).toEqual({ x: 5, y: 100 });
    // Borde izquierdo del día nulo: (20 + 30) / 2 = 25 con y = 105
    expect(result[result.length - 2]).toEqual({ x: 25, y: 105 });
    // Último punto nulo original (no se extiende hacia la derecha en modo estricto)
    expect(result[result.length - 1]).toEqual({ x: 30, y: null });
  });
});
