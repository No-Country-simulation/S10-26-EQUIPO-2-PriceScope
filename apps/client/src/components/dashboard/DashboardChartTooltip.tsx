import { RiAlertLine } from "@remixicon/react";
import type { TooltipProps } from "@/components/charts/line-chart";
import { Badge } from "@/components/ui/badge";
import type { DashboardChartRow } from "@/lib/dashboard";

/**
 * Tooltip personalizado para LineChart que expone precios,
 * cotización de cierre, estado del dato y alerta de aproximación.
 */
export function DashboardChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const rawRow = payload[0]?.payload as unknown as DashboardChartRow | undefined;

  const estadoLabel =
    rawRow?.estadoDato === "DATO_VALIDO"
      ? "Válido"
      : rawRow?.estadoDato === "AGOTADO"
        ? "Agotado"
        : "Sin dato";

  return (
    <div className="min-w-60 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
        <span className="font-mono font-bold text-slate-900">
          Fecha: {rawRow?.fechaIso ?? label}
        </span>
        {rawRow && (
          <Badge
            variant={
              rawRow.estadoDato === "DATO_VALIDO"
                ? "success"
                : rawRow.estadoDato === "AGOTADO"
                  ? "warning"
                  : "error"
            }
            size="xs"
          >
            {estadoLabel}
          </Badge>
        )}
      </div>

      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.category} className="flex items-center justify-between gap-4">
            <span className="text-slate-600">{entry.category}:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {entry.value !== null && entry.value !== undefined
                ? typeof entry.value === "number" && entry.value < 100
                  ? `US$ ${entry.value.toFixed(2)}`
                  : `$${Math.round(Number(entry.value)).toLocaleString("es-AR")}`
                : "Sin dato"}
            </span>
          </div>
        ))}

        {rawRow?.cotizacionAplicada && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1.5 text-[11px]">
            <span className="text-slate-500">Cotiz. aplicada:</span>
            <span className="font-mono font-semibold text-slate-700 tabular-nums">
              ${rawRow.cotizacionAplicada.toLocaleString("es-AR")}
            </span>
          </div>
        )}

        {rawRow?.cotizacionAproximada && (
          <div className="mt-1 flex items-center gap-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
            <RiAlertLine className="size-3.5 shrink-0 text-amber-600" />
            <span>Cotización estimada por cierre anterior</span>
          </div>
        )}

        {rawRow?.motivo && (
          <p className="mt-1 border-t border-slate-100 pt-1 text-[11px] text-slate-500">
            {rawRow.motivo}
          </p>
        )}
      </div>
    </div>
  );
}
