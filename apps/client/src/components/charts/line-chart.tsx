"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  Legend as RechartsLegend,
  LineChart as RechartsLineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AxisDomain } from "recharts/types/util/types";
import {
  AvailableChartColors,
  constructCategoryColors,
  getColorClassName,
  getYAxisDomain,
} from "@/lib/chartUtils";
import { cx } from "@/lib/utils";
import { LineChartLegend } from "./LineChartLegend";
import { LineChartReferenceAreaShape } from "./LineChartReferenceAreaShape";
import { ExtendedLineShape } from "./LineChartShape";
import { ChartTooltip } from "./LineChartTooltip";
import { LineChartYAxisTick } from "./LineChartYAxisTick";
import type {
  ChartReferenceArea,
  LineChartProps,
  TooltipPayloadItem,
  TooltipProps,
} from "./line-chart-types";

export type { ChartReferenceArea, LineChartProps, TooltipPayloadItem, TooltipProps };

/**
 * LineChart financiero basado en Tremor y Recharts.
 * Soporta cortes físicos en Modo Estricto y extensiones continuas a los bordes y recuadros.
 */
export function LineChart({
  data = [],
  categories = [],
  index,
  colors = AvailableChartColors,
  dashedCategories = [],
  valueFormatter = (value: number) => value.toString(),
  startEndOnly = false,
  showXAxis = true,
  showYAxis = true,
  showGridLines = true,
  yAxisWidth = 64,
  showTooltip = true,
  showLegend = true,
  autoMinValue = false,
  minValue,
  maxValue,
  allowDecimals = true,
  connectNulls = false,
  extendEdges = true,
  tickGap = 12,
  legendPosition = "right",
  customTooltip: CustomTooltip,
  referenceAreas = [],
  className,
  ...props
}: LineChartProps) {
  const [activeLegend, setActiveLegend] = React.useState<string | undefined>(undefined);

  const categoryColors = React.useMemo(
    () => constructCategoryColors(categories, colors),
    [categories, colors]
  );

  const yAxisDomain = React.useMemo(
    () => getYAxisDomain(autoMinValue, minValue, maxValue),
    [autoMinValue, minValue, maxValue]
  );

  const handleLegendClick = React.useCallback((category: string) => {
    setActiveLegend((prev) => (prev === category ? undefined : category));
  }, []);

  return (
    <div
      data-slot="line-chart"
      tremor-id="tremor-raw"
      className={cx("h-80 w-full select-none", className)}
      {...props}
    >
      <ResponsiveContainer className="size-full">
        <RechartsLineChart data={data} margin={{ top: 8, left: 12, right: 12, bottom: 4 }}>
          {showGridLines ? (
            <CartesianGrid className="stroke-slate-200/80 stroke-1" horizontal vertical={false} />
          ) : null}

          <XAxis
            hide={!showXAxis}
            dataKey={index}
            scale="band"
            interval="equidistantPreserveStart"
            padding={{ left: 0, right: 0 }}
            tick={{ transform: "translate(0, 6)" }}
            ticks={
              startEndOnly && data.length > 0
                ? [String(data[0][index]), String(data[data.length - 1][index])]
                : undefined
            }
            fill=""
            stroke=""
            className="fill-slate-500 text-xs font-medium"
            tickLine={false}
            axisLine={false}
            minTickGap={tickGap}
          />

          <YAxis
            width={yAxisWidth}
            hide={!showYAxis}
            axisLine={false}
            tickLine={false}
            type="number"
            domain={yAxisDomain as AxisDomain}
            tick={(tickProps) => (
              <LineChartYAxisTick {...tickProps} valueFormatter={valueFormatter} />
            )}
            fill=""
            stroke=""
            className="fill-slate-400 text-[11px] font-medium tabular-nums"
            tickFormatter={valueFormatter}
            allowDecimals={allowDecimals}
          />

          <Tooltip
            wrapperStyle={{ outline: "none" }}
            isAnimationActive={false}
            cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload, label }) => {
              const cleanPayload: TooltipPayloadItem[] = payload
                ? payload
                    .filter((item) => item.value !== null && item.value !== undefined)
                    .map((item) => ({
                      category: String(item.dataKey ?? ""),
                      value: Number(item.value),
                      index: String(
                        (item.payload as Record<string, unknown>)?.[index] ?? label ?? ""
                      ),
                      color: categoryColors.get(String(item.dataKey ?? "")) ?? "blue",
                      payload: (item.payload as Record<string, unknown>) ?? {},
                    }))
                : [];

              if (!showTooltip || !active || cleanPayload.length === 0) {
                return null;
              }

              return CustomTooltip ? (
                <CustomTooltip active={active} payload={cleanPayload} label={String(label ?? "")} />
              ) : (
                <ChartTooltip
                  active={active}
                  payload={cleanPayload}
                  label={String(label ?? "")}
                  valueFormatter={valueFormatter}
                />
              );
            }}
          />

          {showLegend ? (
            <RechartsLegend
              verticalAlign="top"
              height={36}
              content={() => (
                <LineChartLegend
                  categories={categories}
                  categoryColors={categoryColors}
                  activeLegend={activeLegend}
                  legendPosition={legendPosition}
                  onLegendClick={handleLegendClick}
                />
              )}
            />
          ) : null}

          {referenceAreas.map((area) => (
            <ReferenceArea
              key={area.id}
              ifOverflow="visible"
              shape={(shapeProps) => (
                <LineChartReferenceAreaShape
                  shapeProps={shapeProps}
                  area={area}
                  data={data}
                  index={index}
                  showYAxis={showYAxis}
                  yAxisWidth={yAxisWidth}
                />
              )}
            />
          ))}

          {categories.map((category) => {
            const color = categoryColors.get(category) ?? "blue";
            const isDashed = dashedCategories.includes(category);
            const lineConnectNulls = isDashed ? true : connectNulls;
            return (
              <Line
                key={category}
                name={category}
                type="linear"
                dataKey={category}
                stroke=""
                strokeWidth={isDashed ? 2 : 2.5}
                strokeDasharray={isDashed ? "5 4" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                isAnimationActive={false}
                connectNulls={lineConnectNulls}
                strokeOpacity={activeLegend && activeLegend !== category ? 0.25 : 1}
                className={cx(getColorClassName(color, "stroke"))}
                dot={false}
                shape={(lineProps) => (
                  <ExtendedLineShape
                    {...lineProps}
                    connectNulls={lineConnectNulls}
                    extendEdges={extendEdges}
                  />
                )}
                activeDot={(dotProps: { cx?: number; cy?: number }) => {
                  if (dotProps.cx === undefined || dotProps.cy === undefined) {
                    return <g />;
                  }
                  return (
                    <circle
                      cx={dotProps.cx}
                      cy={dotProps.cy}
                      r={4.5}
                      strokeWidth={2}
                      className={cx("stroke-white", getColorClassName(color, "fill"))}
                    />
                  );
                }}
              />
            );
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
