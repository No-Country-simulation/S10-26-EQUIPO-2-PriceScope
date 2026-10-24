import React from "react";
import { RiNotification3Line } from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportButton } from "@/components/ui/ExportButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AlertTableRowView } from "@/lib/alerts/types";
import { AlertTableRowItem } from "./AlertTableRowItem";
import { TableSkeletonRows } from "./TableSkeletonRows";

export interface AlertsTableProps {
  rows: AlertTableRowView[];
  isLoading: boolean;
  limitPerPage?: number;
  children?: React.ReactNode;
  onExportCsv?: () => void;
  onExportJson?: () => void;
}

/**
 * Tabla forense de productos con alerta, botones de exportación unificados e integración de EmptyState.
 */
export function AlertsTable({
  rows,
  isLoading,
  children,
  onExportCsv,
  onExportJson,
}: AlertsTableProps) {
  const isExportDisabled = isLoading || rows.length === 0;

  return (
    <Card className="overflow-hidden shadow-2xs">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Detalle Forense de Productos con Alerta
          </h2>
          <p className="text-xs text-slate-500">
            Productos con divergencia detectada según los filtros activos
          </p>
        </div>
        {(onExportCsv || onExportJson) && (
          <div className="flex items-center gap-2">
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
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-5 py-3.5">Producto Monitoreado</TableHead>
            <TableHead className="px-4 py-3.5">Tienda</TableHead>
            <TableHead className="px-4 py-3.5">Var. ARS</TableHead>
            <TableHead className="px-4 py-3.5">Var. USD</TableHead>
            <TableHead className="px-4 py-3.5">Diferencial (Δpts)</TableHead>
            <TableHead className="px-4 py-3.5">Cotiz. Usada</TableHead>
            <TableHead className="px-4 py-3.5 text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100 font-medium">
          {isLoading ? (
            <TableSkeletonRows count={5} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="p-0">
                <EmptyState
                  title="No se encontraron alertas"
                  description="No existen productos que cumplan con los criterios de divergencia o filtros seleccionados."
                  icon={RiNotification3Line}
                  className="py-12"
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => <AlertTableRowItem key={row.id} row={row} />)
          )}
        </TableBody>
      </Table>
      {children}
    </Card>
  );
}
