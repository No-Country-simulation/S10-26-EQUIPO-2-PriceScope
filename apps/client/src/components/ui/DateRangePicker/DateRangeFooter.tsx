import * as React from "react";
import { RiCheckLine, RiRefreshLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

/**
 * Propiedades del pie de acciones y resumen del DateRangePicker.
 */
export interface DateRangeFooterProps {
  /** Cantidad de días seleccionados en el borrador actual. */
  selectedDayCount: number | null;
  /** Límite máximo de días permitidos por regla de negocio. */
  maxDays: number;
  /** Habilita el botón de confirmación cuando ambos extremos están definidos. */
  canApply: boolean;
  /** Restablece el rango al valor por defecto de 30 días. */
  onReset: () => void;
  /** Cancela la edición y cierra el popover. */
  onCancel: () => void;
  /** Confirma el rango seleccionado y notifica al componente padre. */
  onApply: () => void;
}

/**
 * Pie del selector de fechas con contador de días  y botones de acción de Tremor.
 */
export function DateRangeFooter({
  selectedDayCount,
  maxDays,
  canApply,
  onReset,
  onCancel,
  onApply,
}: DateRangeFooterProps) {
  return (
    <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-100 px-1 pt-2.5">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 tabular-nums">
          {selectedDayCount !== null ? (
            <span className="font-bold text-slate-800">
              {selectedDayCount} {selectedDayCount === 1 ? "día" : "días"}
            </span>
          ) : (
            <span className="text-slate-400">Sin rango</span>
          )}
          <span className="text-slate-300">•</span>
          <span className="text-[10px] text-slate-400">Máx. {maxDays}d</span>
        </div>

        <Button variant="ghost" size="xs" onClick={onReset} className="gap-1">
          <RiRefreshLine className="size-3" />
          <span>Restablecer</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" onClick={onApply} disabled={!canApply}>
          <RiCheckLine className="size-3.5 shrink-0" />
          <span>Aplicar</span>
        </Button>
      </div>
    </div>
  );
}
