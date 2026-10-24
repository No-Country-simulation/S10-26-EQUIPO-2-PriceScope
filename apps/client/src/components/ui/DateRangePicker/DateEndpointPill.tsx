import * as React from "react";
import { format } from "date-fns";

import { StatusDot } from "@/components/ui/StatusDot";
import { cx } from "@/lib/utils";

/**
 * Propiedades de la píldora de extremo de fecha (`Desde` / `Hasta`).
 */
export interface DateEndpointPillProps {
  /** Etiqueta superior del extremo (`Desde` o `Hasta`). */
  label: string;
  /** Descripción accesible del botón. */
  title: string;
  /** Fecha actual asignada a este extremo. */
  date?: Date;
  /** Indica si este extremo está activo para edición directa en el calendario. */
  isActive: boolean;
  /** Callback al hacer clic sobre la píldora. */
  onClick: () => void;
}

/**
 * Píldora interactiva para saltar al mes de "Desde" o "Hasta" y editar ese extremo.
 */
export function DateEndpointPill({ label, title, date, isActive, onClick }: DateEndpointPillProps) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      title={title}
      className={cx(
        "group flex min-w-0 cursor-pointer flex-col rounded-lg border px-2.5 py-1.5 text-left transition-all duration-150 ease-out select-none active:scale-[0.97]",
        isActive
          ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500"
          : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/70"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          {label}
        </span>
        {isActive ? (
          <StatusDot variant="blue" size="xs" pulse className="bg-blue-600" />
        ) : (
          <span className="text-[9px] font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
            Editar
          </span>
        )}
      </div>
      <span className="mt-0.5 truncate text-xs font-bold text-slate-900 tabular-nums">
        {date ? format(date, "dd/MM/yyyy") : "Seleccionar"}
      </span>
    </button>
  );
}
