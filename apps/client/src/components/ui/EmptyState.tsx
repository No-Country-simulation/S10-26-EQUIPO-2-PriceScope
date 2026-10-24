import * as React from "react";
import { RiInboxArchiveLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  /** Título del estado vacío */
  title: string;
  /** Descripción secundaria */
  description?: string;
  /** Ícono personalizado opcional (por defecto RiInboxArchiveLine) */
  icon?: React.ElementType;
  /** Texto del botón de acción opcional */
  actionLabel?: string;
  /** Callback al pulsar el botón de acción */
  onAction?: () => void;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente unificado para estados vacíos (tablas, listas o tarjetas sin datos).
 */
export function EmptyState({
  title,
  description,
  icon: Icon = RiInboxArchiveLine,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      role="status"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          className="mt-4 text-xs font-semibold"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
