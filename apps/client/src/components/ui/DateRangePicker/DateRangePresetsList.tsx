import * as React from "react";

import { StatusDot } from "@/components/ui/StatusDot";
import { type DateRange, type DateRangePreset, isPresetRangeMatch } from "@/lib/dateRangeUtils";
import { cx } from "@/lib/utils";

/**
 * Propiedades de la lista lateral de atajos rápidos del DateRangePicker.
 */
export interface DateRangePresetsListProps {
  /** Lista de atajos predefinidos. */
  presets: readonly DateRangePreset[];
  /** Rango temporal en edición actual. */
  draftRange?: DateRange;
  /** Callback ejecutado al elegir un atajo. */
  onSelect: (preset: DateRangePreset) => void;
}

/**
 * Columna lateral de atajos rápidos de rango temporal (`PresetContainer` de Tremor).
 */
export function DateRangePresetsList({ presets, draftRange, onSelect }: DateRangePresetsListProps) {
  if (presets.length === 0) return null;

  return (
    <div className="mb-2 flex min-w-40 flex-row flex-wrap gap-1 border-b border-slate-200 pb-2 sm:mr-1 sm:mb-0 sm:w-44 sm:flex-col sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0">
      <span className="mb-0.5 px-2 py-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        Atajos Rápidos
      </span>
      {presets.map((preset) => {
        const active = isPresetRangeMatch(draftRange, preset);
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset)}
            className={cx(
              "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-all duration-150 ease-out active:scale-[0.98]",
              active
                ? "bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-500/20"
                : "font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600"
            )}
          >
            <span>{preset.label}</span>
            {active && <StatusDot variant="blue" size="xs" className="ml-2 bg-blue-600" />}
          </button>
        );
      })}
    </div>
  );
}
