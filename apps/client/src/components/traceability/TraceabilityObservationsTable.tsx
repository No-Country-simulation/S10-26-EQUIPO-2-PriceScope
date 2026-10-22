import React from "react";
import { RiHistoryLine, RiSearchEyeLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportButton } from "@/components/ui/ExportButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeletonRows } from "@/components/ui/TableSkeletonRows";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCurrency,
  formatTimestampToART,
  formatUnitPrice,
  getStatusBadgeConfig,
} from "@/lib/traceability";
import type { ObservacionTrazabilidadItem } from "@/types/api";

export interface StoreOption {
  id: string;
  name: string;
}

export interface TraceabilityObservationsTableProps {
  observations: ObservacionTrazabilidadItem[];
  isLoading?: boolean;
  onExportCsv?: () => void;
  onExportJson?: () => void;
  availableStores?: StoreOption[];
  selectedStore?: string;
  onStoreChange?: (storeId: string) => void;
  children?: React.ReactNode;
}

function ObservationRowItem({ row }: { row: ObservacionTrazabilidadItem }) {
  const badgeConfig = getStatusBadgeConfig(row.estado_dato);
  const isApprox = row.cotizacion_aproximada ?? false;

  return (
    <TableRow className="text-xs hover:bg-slate-50/70">
      {/* 1. Fecha y Hora en ART UTC-3 */}
      <TableCell className="px-3 py-3 font-medium whitespace-nowrap text-slate-700">
        <span className="font-mono text-[11px] tabular-nums">
          {formatTimestampToART(row.timestamp_utc)}
        </span>
      </TableCell>

      {/* 2. Tienda */}
      <TableCell className="px-3 py-3 font-semibold whitespace-nowrap text-slate-800">
        {row.tienda_nombre}
      </TableCell>

      {/* 3. Precio Regular Actual */}
      <TableCell className="px-3 py-3 font-bold whitespace-nowrap text-slate-900 tabular-nums">
        {formatCurrency(row.precio_regular)}
      </TableCell>

      {/* 4. Precio Unitario Normalizado */}
      <TableCell className="px-3 py-3 font-bold whitespace-nowrap text-purple-700 tabular-nums">
        {formatUnitPrice(row.precio_por_unidad, row.unidad_medida)}
      </TableCell>

      {/* 5. Variación Diaria */}
      <TableCell className="px-3 py-3 font-medium whitespace-nowrap tabular-nums">
        {row.variacion_diaria_pct !== null && row.variacion_diaria_pct !== undefined ? (
          <span
            className={
              row.variacion_diaria_pct > 0
                ? "font-bold text-rose-600"
                : row.variacion_diaria_pct < 0
                  ? "font-bold text-emerald-600"
                  : "text-slate-500"
            }
          >
            {row.variacion_diaria_pct > 0
              ? `+${row.variacion_diaria_pct}%`
              : `${row.variacion_diaria_pct}%`}
          </span>
        ) : (
          <span className="text-slate-400">---</span>
        )}
      </TableCell>

      {/* 6. Estado de Integridad / Stock */}
      <TableCell className="px-3 py-3 whitespace-nowrap">
        <Badge
          variant={badgeConfig.variant}
          size="xs"
          title={badgeConfig.tooltip}
          className="font-bold tracking-tight uppercase"
        >
          {badgeConfig.label}
        </Badge>
      </TableCell>

      {/* 7. Cotización USD Aplicada */}
      <TableCell className="px-3 py-3 whitespace-nowrap text-slate-600 tabular-nums">
        {row.cotizacion_aplicada ? (
          <span className="font-mono text-[11px]">
            {formatCurrency(row.cotizacion_aplicada)}{" "}
            <span className="text-[10px] text-slate-400">{isApprox ? "(Aprox.)" : "(Blue)"}</span>
          </span>
        ) : (
          <span className="text-slate-400">---</span>
        )}
      </TableCell>

      {/* 8. Precio Equivalente USD */}
      <TableCell className="px-3 py-3 font-semibold whitespace-nowrap text-slate-700 tabular-nums">
        {row.precio_usd !== null && row.precio_usd !== undefined ? (
          `US$ ${row.precio_usd.toFixed(2)}`
        ) : (
          <span className="text-slate-400">---</span>
        )}
      </TableCell>
    </TableRow>
  );
}

/**
 * Tabla certificada forense de observaciones históricas con botones de exportación unificados y EmptyState.
 */
export function TraceabilityObservationsTable({
  observations,
  isLoading = false,
  onExportCsv,
  onExportJson,
  availableStores = [],
  selectedStore = "all",
  onStoreChange,
  children,
}: TraceabilityObservationsTableProps) {
  const hasObservations = observations.length > 0;
  const isExportDisabled = !hasObservations || isLoading;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
      {/* Cabecera con selector de tienda y botones de exportar */}
      <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <RiHistoryLine className="size-4 text-slate-700" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900">
              Registro Histórico de Observaciones Diarias (Append-Only)
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Serie inmutable certificada. Prohibido el uso de cero (0) ante faltantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableStores.length > 0 && onStoreChange && (
            <div className="w-44">
              <Select value={selectedStore} onValueChange={onStoreChange}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Todas las tiendas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tiendas</SelectItem>
                  {availableStores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {onExportCsv && (
            <ExportButton
              formatLabel="CSV"
              onExport={onExportCsv}
              disabled={isExportDisabled}
              aria-label="Exportar CSV"
            />
          )}

          {onExportJson && (
            <ExportButton
              formatLabel="JSON"
              onExport={onExportJson}
              disabled={isExportDisabled}
              aria-label="Exportar JSON"
            />
          )}
        </div>
      </div>

      {/* Tabla sin scroll horizontal */}
      <div className="w-full overflow-hidden">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 py-3">Fecha y Hora (ART)</TableHead>
              <TableHead className="px-3 py-3">Tienda</TableHead>
              <TableHead className="px-3 py-3">Precio Regular</TableHead>
              <TableHead className="px-3 py-3">Precio $/Unidad</TableHead>
              <TableHead className="px-3 py-3">Var. Diaria</TableHead>
              <TableHead className="px-3 py-3">Estado Stock</TableHead>
              <TableHead className="px-3 py-3">Cotiz. USD</TableHead>
              <TableHead className="px-3 py-3">Precio USD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows rowCount={4} columnCount={8} cellClassName="px-3 py-3" />
            ) : !hasObservations ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    title="No se registraron observaciones"
                    description="No existen datos forenses reportados para la tienda o rango seleccionado."
                    icon={RiSearchEyeLine}
                    className="py-12"
                  />
                </TableCell>
              </TableRow>
            ) : (
              observations.map((row, index) => (
                <ObservationRowItem
                  key={`${row.tienda_id}-${row.timestamp_utc}-${index}`}
                  row={row}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {children}
    </section>
  );
}
