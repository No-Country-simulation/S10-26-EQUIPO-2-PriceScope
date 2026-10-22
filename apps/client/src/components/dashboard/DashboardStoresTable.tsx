import { RiStore2Line } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/components/ui/StatusDot";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PilotStoreAuditRow } from "@/lib/dashboard";
import type { Moneda } from "@/types/api";

interface DashboardStoresTableProps {
  isLoading: boolean;
  rows: PilotStoreAuditRow[];
  currency?: Moneda;
}

/**
 * Tabla de Auditoría de Tiendas y Cobertura con soporte de carga Skeleton.
 */
export function DashboardStoresTable({
  isLoading,
  rows,
  currency = "ARS",
}: DashboardStoresTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <RiStore2Line className="size-4 text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Auditoría de Tiendas y Cobertura</h2>
            <p className="text-xs text-slate-500">
              Desempeño y consistencia de datos en las cadenas comerciales monitoreadas
            </p>
          </div>
        </div>
        <Badge variant="success">
          {isLoading ? "Cargando..." : `${rows.length} Tiendas Activas`}
        </Badge>
      </div>

      <Table className="text-xs text-slate-600">
        <TableHeader className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-48 px-6 py-3">Cadena / Tienda</TableHead>
            <TableHead className="min-w-36 px-6 py-3">
              Canasta Regular (
              {currency === "ARS"
                ? "ARS"
                : currency === "USD_BLUE"
                  ? "USD Blue"
                  : currency === "USD_OFICIAL"
                    ? "USD Oficial"
                    : "USD"}
              )
            </TableHead>
            <TableHead className="min-w-32 px-6 py-3">Variación Mes</TableHead>
            <TableHead className="min-w-32 px-6 py-3">Publicaciones</TableHead>
            <TableHead className="min-w-36 px-6 py-3">Calidad Scraping</TableHead>
            <TableHead className="min-w-32 px-6 py-3">Última Sincro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100 font-medium">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="min-w-48 px-6 py-3.5">
                  <Skeleton className="mb-1 h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </TableCell>
                <TableCell className="min-w-36 px-6 py-3.5">
                  <Skeleton className="h-4 w-18" />
                </TableCell>
                <TableCell className="min-w-32 px-6 py-3.5">
                  <Skeleton className="h-4 w-14" />
                </TableCell>
                <TableCell className="min-w-32 px-6 py-3.5">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="min-w-36 px-6 py-3.5">
                  <Skeleton className="h-5 w-28 rounded-md" />
                </TableCell>
                <TableCell className="min-w-32 px-6 py-3.5">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="p-0">
                <EmptyState
                  title="No se encontraron tiendas"
                  description="No existen datos de auditoría para los criterios seleccionados."
                  icon={RiStore2Line}
                  className="py-12"
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50/60">
                <TableCell className="min-w-48 px-6 py-3.5">
                  <p className="font-bold text-slate-900">{row.name}</p>
                  <p className="text-[10px] text-slate-400">{row.tag}</p>
                </TableCell>
                <TableCell className="min-w-36 px-6 py-3.5 font-bold text-slate-900 tabular-nums">
                  {row.basketCost}
                </TableCell>
                <TableCell className="min-w-32 px-6 py-3.5 font-bold text-rose-600 tabular-nums">
                  {row.monthlyVariation}
                </TableCell>
                <TableCell className="min-w-32 px-6 py-3.5 text-slate-700 tabular-nums">
                  {row.skusCount} SKUs
                </TableCell>
                <TableCell className="min-w-36 px-6 py-3.5">
                  <Badge variant={row.statusVariant}>
                    <StatusDot
                      variant={
                        row.statusVariant === "success"
                          ? "emerald"
                          : row.statusVariant === "warning"
                            ? "amber"
                            : "rose"
                      }
                    />
                    <span>{row.healthLabel}</span>
                  </Badge>
                </TableCell>
                <TableCell className="min-w-32 px-6 py-3.5 text-slate-500 tabular-nums">
                  {row.syncTimeArt}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
