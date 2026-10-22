export interface ChartCoordinate {
  x: number | null;
  y: number | null;
}

function isValidCoord(p: ChartCoordinate | undefined): p is { x: number; y: number } {
  return (
    typeof p?.x === "number" &&
    typeof p?.y === "number" &&
    Number.isFinite(p.x) &&
    Number.isFinite(p.y)
  );
}

/**
 * Extiende las coordenadas de una serie hacia las fronteras de recuadros y bordes del gráfico.
 * En Modo Estricto conecta con los bordes de los cortes. En Modo Continuo proyecta sobre los recuadros extremos.
 */
export function extendPointsToGapBoundaries<T extends ChartCoordinate>(
  points: ReadonlyArray<T> | undefined,
  connectNulls: boolean = false,
  extendEdges: boolean = true
): T[] {
  if (!points || points.length === 0) {
    return [];
  }

  const len = points.length;
  let slotWidth = 0;
  for (let i = 0; i < len - 1; i++) {
    if (typeof points[i]?.x === "number" && typeof points[i + 1]?.x === "number") {
      const diff = Math.abs((points[i + 1].x as number) - (points[i].x as number));
      if (diff > 0) {
        slotWidth = diff;
        break;
      }
    }
  }

  let firstValidIndex = -1;
  let lastValidIndex = -1;
  for (let i = 0; i < len; i++) {
    if (isValidCoord(points[i])) {
      if (firstValidIndex === -1) firstValidIndex = i;
      lastValidIndex = i;
    }
  }

  if (firstValidIndex === -1 || lastValidIndex === -1) {
    return [...points];
  }

  const firstVal = points[firstValidIndex].y as number;
  const lastVal = points[lastValidIndex].y as number;

  if (connectNulls) {
    const result: T[] = [];
    if (extendEdges && slotWidth > 0 && typeof points[0].x === "number") {
      result.push({ ...points[0], x: points[0].x - slotWidth / 2, y: firstVal });
    }
    for (let i = 0; i < len; i++) {
      if (i < firstValidIndex) {
        result.push({ ...points[i], y: firstVal });
      } else if (i > lastValidIndex) {
        result.push({ ...points[i], y: lastVal });
      } else {
        result.push(points[i]);
      }
    }
    if (extendEdges && slotWidth > 0 && typeof points[len - 1].x === "number") {
      result.push({
        ...points[len - 1],
        x: (points[len - 1].x as number) + slotWidth / 2,
        y: lastVal,
      });
    }
    return result;
  }

  const result: T[] = [];
  if (extendEdges && slotWidth > 0 && isValidCoord(points[0]) && typeof points[0].x === "number") {
    result.push({ ...points[0], x: points[0].x - slotWidth / 2, y: points[0].y });
  }

  for (let i = 0; i < len; i++) {
    const curr = points[i];
    const prev = i > 0 ? points[i - 1] : undefined;
    const next = i < len - 1 ? points[i + 1] : undefined;

    const currValid = isValidCoord(curr);
    const prevValid = isValidCoord(prev);
    const nextValid = isValidCoord(next);

    if (!prevValid && currValid && prev && typeof prev.x === "number") {
      result.push({ ...curr, x: (prev.x + (curr.x as number)) / 2, y: curr.y });
    }

    result.push(curr);

    if (currValid && !nextValid && next && typeof next.x === "number") {
      result.push({ ...curr, x: ((curr.x as number) + next.x) / 2, y: curr.y });
    }
  }

  if (
    extendEdges &&
    slotWidth > 0 &&
    isValidCoord(points[len - 1]) &&
    typeof points[len - 1].x === "number"
  ) {
    result.push({
      ...points[len - 1],
      x: (points[len - 1].x as number) + slotWidth / 2,
      y: points[len - 1].y,
    });
  }

  return result;
}
