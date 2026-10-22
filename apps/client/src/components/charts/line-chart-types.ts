import type * as React from "react";
import type { AvailableChartColorsKeys } from "@/lib/chartUtils";

export interface ChartReferenceArea {
  id: string;
  x1: string;
  x2: string;
  startIndex?: number;
  endIndex?: number;
  totalPoints?: number;
  label?: string;
  labelColor?: string;
  strokeColor?: string;
  fillColor?: string;
  fillOpacity?: number;
}

export interface TooltipPayloadItem {
  category: string;
  value: number;
  index: string;
  color: AvailableChartColorsKeys;
  payload: Record<string, unknown>;
}

export interface TooltipProps {
  active: boolean | undefined;
  payload: TooltipPayloadItem[];
  label: string;
}

export interface LineChartProps extends React.ComponentProps<"div"> {
  data: Record<string, unknown>[];
  index: string;
  categories: string[];
  colors?: AvailableChartColorsKeys[];
  dashedCategories?: string[];
  valueFormatter?: (value: number) => string;
  startEndOnly?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGridLines?: boolean;
  yAxisWidth?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  autoMinValue?: boolean;
  minValue?: number;
  maxValue?: number;
  allowDecimals?: boolean;
  connectNulls?: boolean;
  extendEdges?: boolean;
  tickGap?: number;
  legendPosition?: "left" | "center" | "right";
  customTooltip?: React.ComponentType<TooltipProps>;
  referenceAreas?: ChartReferenceArea[];
}
