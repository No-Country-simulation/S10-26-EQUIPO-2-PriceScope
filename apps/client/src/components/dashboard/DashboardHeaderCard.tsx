import React from "react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";

/**
 * Cabecera ejecutiva del Tablero Macroeconómico que utiliza el componente unificado PageHeader.
 */
export function DashboardHeaderCard() {
  return (
    <PageHeader
      title="Tablero Macroeconómico de Inflación"
      description="Monitoreo analítico de canasta retail y correlación con divisa (ARS / USD Blue / Oficial)"
      badge={
        <Badge variant="teal" className="hidden font-semibold sm:inline-flex">
          B2B Real-Time
        </Badge>
      }
    />
  );
}
