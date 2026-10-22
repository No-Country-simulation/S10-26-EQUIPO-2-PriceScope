import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export interface TableSkeletonRowsProps {
  /** Cantidad de filas de carga a mostrar (por defecto 4) */
  rowCount?: number;
  /** Cantidad de celdas por fila (por defecto 7) */
  columnCount?: number;
  /** Clases CSS adicionales para la celda */
  cellClassName?: string;
}

/**
 * Componente unificado para desplegar filas de carga (Skeleton) en tablas de datos.
 */
export function TableSkeletonRows({
  rowCount = 4,
  columnCount = 7,
  cellClassName = "px-4 py-3.5",
}: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={`table-skeleton-row-${rowIndex}`}>
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <TableCell
              key={`table-skeleton-cell-${rowIndex}-${colIndex}`}
              className={cellClassName}
            >
              <Skeleton
                className={`h-4 ${
                  colIndex === 0 ? "w-28" : colIndex === columnCount - 1 ? "ml-auto w-16" : "w-20"
                }`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
