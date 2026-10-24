import * as React from "react";
import { TableSkeletonRows as BaseTableSkeletonRows } from "@/components/ui/TableSkeletonRows";

export interface TableSkeletonRowsProps {
  count?: number;
}

/**
 * Filas de carga para la tabla de alertas (7 columnas) que reutiliza el primitivo transversal TableSkeletonRows.
 */
export function TableSkeletonRows({ count = 5 }: TableSkeletonRowsProps) {
  return <BaseTableSkeletonRows rowCount={count} columnCount={7} cellClassName="px-4 py-3.5" />;
}
