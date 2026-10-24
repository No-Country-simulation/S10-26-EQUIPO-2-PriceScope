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
 * Dibuja el rectángulo y etiqueta de una zona de referencia vertical en el gráfico.
 */
export function LineChartReferenceAreaShape({
  shapeProps,
  area,
  data,
  index,
  showYAxis,
  yAxisWidth,
}: LineChartReferenceAreaShapeProps) {
  const plotLeft = (showYAxis ? yAxisWidth : 0) + 12;
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

  return (
    <g key={`ref-area-${area.id}`} className="pointer-events-none select-none">
      <rect
        x={actualX}
        y={yVal}
        width={actualWidth}
        height={heightVal}
        rx={4}
        ry={4}
        fill={area.fillColor ?? "#fef3c7"}
        fillOpacity={area.fillOpacity ?? 0.35}
        stroke={area.strokeColor ?? "#f59e0b"}
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      {area.label && actualWidth >= 32 ? (
        <text
          x={actualX + actualWidth / 2}
          y={yVal + heightVal - 8}
          textAnchor="middle"
          fill={area.labelColor ?? area.strokeColor ?? "#d97706"}
          fontSize={10.5}
          fontWeight={700}
          className="tracking-tight"
        >
          {area.label}
        </text>
      ) : null}
    </g>
  );
}
