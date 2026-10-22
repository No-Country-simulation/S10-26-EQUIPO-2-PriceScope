import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limitPerPage?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  /** Nombre semántico de la entidad paginada (ej. "alertas", "observaciones", "registros") */
  entityName?: string;
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "ellipsis", total];
  if (current >= total - 2) return [1, "ellipsis", total - 2, total - 1, total];
  return [1, "ellipsis", current, "ellipsis", total];
}

/**
 * Componente unificado de paginación para tablas de datos (Alertas, Trazabilidad, etc.)
 * Respetando la estética y los estándares de accesibilidad de PriceScope.
 */
export function DataTablePagination({
  currentPage,
  totalPages,
  totalRecords,
  limitPerPage = 10,
  onPageChange,
  isLoading = false,
  entityName = "registros",
}: DataTablePaginationProps) {
  const from = totalRecords === 0 ? 0 : (currentPage - 1) * limitPerPage + 1;
  const to = Math.min(totalRecords, currentPage * limitPerPage);
  const visiblePages = getVisiblePages(currentPage, Math.max(1, totalPages));

  return (
    <div className="flex flex-col justify-between gap-4 border-t border-slate-200/80 bg-slate-50/60 p-4 md:flex-row md:items-center">
      <p className="text-xs text-slate-500">
        Mostrando{" "}
        <strong className="font-semibold text-slate-800 tabular-nums">
          {from}-{to} de {totalRecords} {entityName}
        </strong>
      </p>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1 || isLoading}
              className={currentPage <= 1 || isLoading ? "pointer-events-none opacity-40" : ""}
            />
          </PaginationItem>

          {visiblePages.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => onPageChange(page)}
                  disabled={isLoading}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className={
                currentPage >= totalPages || isLoading ? "pointer-events-none opacity-40" : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
