import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export interface AlertsHeaderProps {
  criticalCount: number;
  isLoading?: boolean;
}

/**
 * Cabecera ejecutiva de Alertas que utiliza el componente unificado PageHeader.
 */
export function AlertsHeader({ criticalCount, isLoading = false }: AlertsHeaderProps) {
  return (
    <PageHeader
      title="Alertas de Inflación Divergente"
      description="Detección algorítmica de productos cuya aceleración de precio regular supera a la divisa cambiaria (Δ > 0)"
      badge={
        isLoading ? (
          <Skeleton className="h-6 w-32 rounded-full" />
        ) : (
          <Badge variant="error" className="rounded-full px-2.5 py-1 text-[11px] font-bold">
            {criticalCount} Críticas Activas
          </Badge>
        )
      }
    />
  );
}
