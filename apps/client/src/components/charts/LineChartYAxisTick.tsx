import type { YAxisTickContentProps } from "recharts/types/util/types";

export interface LineChartYAxisTickProps extends YAxisTickContentProps {
  valueFormatter?: (value: number) => string;
}

/**
 * Componente visual para las marcas del eje Y en LineChart.
 */
export function LineChartYAxisTick(props: LineChartYAxisTickProps) {
  const numX = typeof props.x === "number" ? props.x : Number(props.x) || 0;
  const numY = typeof props.y === "number" ? props.y : Number(props.y) || 0;
  const rawVal = props.payload?.value;
  const numVal = typeof rawVal === "number" ? rawVal : Number(rawVal) || 0;
  const text = props.valueFormatter ? props.valueFormatter(numVal) : String(numVal);

  return (
    <text
      x={numX - 4}
      y={numY}
      dy={3.5}
      textAnchor="end"
      className="fill-slate-400 text-[11px] font-medium tabular-nums select-none"
    >
      {text}
    </text>
  );
}
