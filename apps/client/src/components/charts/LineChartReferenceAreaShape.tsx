import type { ChartReferenceArea } from "./line-chart-types";

export interface ReferenceAreaShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface LineChartReferenceAreaShapeProps {
  shapeProps: ReferenceAreaShapeProps;
  area: ChartReferenceArea;
  data: Record<string, unknown>[];
  index: string;
  showYAxis: boolean;
  yAxisWidth: number;
}

/**
 * Dibuja el rectángulo sombreado con borde punteado (- - -) de una zona de anomalía en el gráfico.
 * Los textos identificadores se muestran exclusivamente en la leyenda inferior (Tracker) para evitar redundancia visual.
 * Aplica insets exactos al stroke para garantizar que los bordes punteados se representen con fidelidad total.
 */
export function LineChartReferenceAreaShape({
  shapeProps,
  area,
  data,
  index,
  showYAxis,
  yAxisWidth,
}: LineChartReferenceAreaShapeProps) {
  const plotLeft =
    typeof shapeProps.x === "number" && shapeProps.x > 0
      ? shapeProps.x
      : (showYAxis ? yAxisWidth : 0) + 12;
  const plotWidth = shapeProps.width ?? 0;
  const yVal = shapeProps.y ?? 0;
  const heightVal = shapeProps.height ?? 0;

  if (plotWidth <= 0 || heightVal <= 0) {
    return <g />;
  }

  const totalPoints = area.totalPoints ?? data.length;
  if (totalPoints <= 0) {
    return <g />;
  }

  const slotWidth = plotWidth / totalPoints;
  const startIndex = area.startIndex ?? data.findIndex((item) => String(item[index]) === area.x1);
  const safeStart = startIndex >= 0 ? startIndex : 0;

  const endIndex = area.endIndex ?? data.findLastIndex((item) => String(item[index]) === area.x2);
  const safeEnd = endIndex >= 0 ? endIndex : safeStart;

  const actualX = plotLeft + safeStart * slotWidth;
  const actualWidth = (safeEnd - safeStart + 1) * slotWidth;

  const strokeWidth = 1.5;
  const halfStroke = strokeWidth / 2;
  const drawX = actualX + halfStroke;
  const drawY = yVal + halfStroke;
  const drawWidth = Math.max(0, actualWidth - strokeWidth);
  const drawHeight = Math.max(0, heightVal - strokeWidth);
  const cornerRadius = Math.min(4, drawWidth / 2, drawHeight / 2);

  return (
    <g key={`ref-area-${area.id}`} className="pointer-events-none select-none">
      <rect
        x={drawX}
        y={drawY}
        width={drawWidth}
        height={drawHeight}
        rx={cornerRadius}
        ry={cornerRadius}
        fill={area.fillColor ?? "#fef3c7"}
        fillOpacity={area.fillOpacity ?? 0.35}
        stroke={area.strokeColor ?? "#f59e0b"}
        strokeWidth={strokeWidth}
        strokeDasharray="4 4"
      />
    </g>
  );
}
