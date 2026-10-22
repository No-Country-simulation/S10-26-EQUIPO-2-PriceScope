import * as React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "@/components/ui/DataTablePagination";

export interface TraceabilityPaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limitPerPage?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Componente de paginación para la tabla de observaciones forenses
 * que delega en el componente transversal DataTablePagination.
 */
export function TraceabilityPagination({
  currentPage,
  totalPages,
  totalRecords,
  limitPerPage = 10,
  onPageChange,
  isLoading = false,
}: TraceabilityPaginationProps) {
  const props: DataTablePaginationProps = {
    currentPage,
    totalPages,
    totalRecords,
    limitPerPage,
    onPageChange,
    isLoading,
    entityName: "observaciones",
  };

  return <DataTablePagination {...props} />;
}
