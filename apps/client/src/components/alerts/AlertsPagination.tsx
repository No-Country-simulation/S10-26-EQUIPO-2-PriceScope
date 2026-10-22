import * as React from "react";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "@/components/ui/DataTablePagination";

export interface AlertsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalAlerts: number;
  limitPerPage?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * Componente de paginación para la tabla de alertas de inflación que reutiliza DataTablePagination.
 */
export function AlertsPagination({
  currentPage,
  totalPages,
  totalAlerts,
  limitPerPage = 50,
  onPageChange,
  isLoading = false,
}: AlertsPaginationProps) {
  const props: DataTablePaginationProps = {
    currentPage,
    totalPages,
    totalRecords: totalAlerts,
    limitPerPage,
    onPageChange,
    isLoading,
    entityName: "alertas",
  };

  return <DataTablePagination {...props} />;
}
