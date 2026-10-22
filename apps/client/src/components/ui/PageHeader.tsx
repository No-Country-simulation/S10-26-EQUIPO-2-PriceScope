import * as React from "react";
import { Card } from "@/components/ui/card";

export interface PageHeaderProps {
  /** Título principal de la página */
  title: string;
  /** Subtítulo o descripción explicativa bajo el título */
  description?: string;
  /** Badges o elementos a la derecha del título (ej: B2B Real-Time, Críticas Activas) */
  badge?: React.ReactNode;
  /** Elemento opcional superior (ej: botón Volver, migas de pan, SKU) */
  topContent?: React.ReactNode;
  /** Acciones a la derecha en la cabecera */
  actions?: React.ReactNode;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente unificado de cabecera de página (Dashboard, Alertas, Trazabilidad)
 * respetando el estándar visual Card, espaciado uniforme y tipografía B2B.
 */
export function PageHeader({
  title,
  description,
  badge,
  topContent,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <Card className={`p-5 ${className}`}>
      {topContent && <div className="mb-3">{topContent}</div>}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </Card>
  );
}
