import { RiLineChartLine } from "@remixicon/react";
import { LineChart, type ChartReferenceArea } from "@/components/charts/line-chart";
import { Tracker, type TrackerBlockProps } from "@/components/charts/tracker";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDashboardCurrencyValue, type DashboardChartRow } from "@/lib/dashboard";
import type { HitoGrafico, Moneda } from "@/types/api";
import { DashboardChartTooltip } from "./DashboardChartTooltip";
import { DashboardEvolutionLegend } from "./DashboardEvolutionLegend";

interface DashboardEvolutionSectionProps {
  isLoading: boolean;
  chartData: DashboardChartRow[];
  trackerData: TrackerBlockProps[];
  milestones?: HitoGrafico[];
  selectedCurrency: Moneda;
  chartMode: "strict" | "continuous";
  onChartModeChange: (mode: "strict" | "continuous") => void;
  downsamplingActive: boolean;
  referenceAreas?: ChartReferenceArea[];
}

/**
 * Sección principal del gráfico de evolución temporal con trackers y zonas de estado.
 */
export function DashboardEvolutionSection({
  isLoading,
  chartData,
  trackerData,
  selectedCurrency,
  chartMode,
  onChartModeChange,
  downsamplingActive,
  referenceAreas = [],
}: DashboardEvolutionSectionProps) {
  return (
    <Card className="space-y-5 p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Evolución Temporal de Precios vs. Referencia Cambiaria
            </h2>
            {downsamplingActive && (
              <Badge variant="default" size="xs">
                Agrupación activa ({chartData.length} pts)
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Comparativa histórica de precios promedio frente al tipo de cambio de referencia
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3.5 rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-3.5 rounded-full bg-blue-600" />
              <span className="text-[11px] font-semibold text-slate-700">
                Canasta Retail ({selectedCurrency === "ARS" ? "ARS" : "USD"})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0 w-3.5 border-t-2 border-dashed border-slate-400" />
              <span className="text-[11px] font-medium text-slate-500">
                Dólar Blue (Ref. Cambiaria)
              </span>
            </div>
          </div>

          <Tabs
            value={chartMode}
            onValueChange={(val) => onChartModeChange(val as "strict" | "continuous")}
          >
            <TabsList>
              <TabsTrigger value="strict">
                <span
                  className={`size-1.5 rounded-full ${
                    chartMode === "strict" ? "bg-blue-600" : "bg-slate-400"
                  }`}
                />
                <span>Modo Estricto</span>
              </TabsTrigger>
              <TabsTrigger value="continuous">
                <span
                  className={`size-1.5 rounded-full ${
                    chartMode === "continuous" ? "bg-blue-600" : "bg-slate-400"
                  }`}
                />
                <span>Modo Continuo</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div>
            <Skeleton className="h-72 w-full rounded-lg" />
            <div className="mt-2 pr-3 pl-24">
              <Skeleton className="h-3.5 w-full rounded-sm" />
            </div>
          </div>
          <div className="flex justify-end pt-1 pr-3">
            <Skeleton className="h-4 w-44" />
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <EmptyState
          title="Sin datos de cotización"
          description="No se registraron variaciones de precios para el rango temporal o filtros seleccionados."
          icon={RiLineChartLine}
          className="py-16"
        />
      ) : (
        <div className="space-y-2">
          <div>
            <LineChart
              data={chartData}
              index="fechaLabel"
              categories={["Canasta Retail", "Dólar Blue (Ref. Cambiaria)"]}
              colors={["blue", "slate"]}
              dashedCategories={["Dólar Blue (Ref. Cambiaria)"]}
              connectNulls={chartMode === "continuous"}
              valueFormatter={(val) => formatDashboardCurrencyValue(val, selectedCurrency)}
              showXAxis={false}
              showLegend={false}
              yAxisWidth={84}
              customTooltip={DashboardChartTooltip}
              referenceAreas={referenceAreas}
              className="h-72"
            />
            <div className="mt-2 pr-3 pl-24">
              <Tracker data={trackerData} className="h-3.5" />
            </div>
          </div>

          <DashboardEvolutionLegend trackerData={trackerData} />
        </div>
      )}
    </Card>
  );
}
