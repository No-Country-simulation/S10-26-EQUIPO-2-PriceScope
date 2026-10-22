"use client";

import * as React from "react";
import { RiArrowRightLine, RiCalendar2Line } from "@remixicon/react";
import { tv, type VariantProps } from "tailwind-variants";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type DateRange, type DateRangePreset, formatDateRangeLabel } from "@/lib/dateRangeUtils";
import { useDateRangeDraft } from "@/hooks/useDateRangeDraft";
import { cx, focusInput, hasErrorInput } from "@/lib/utils";

import { DateEndpointPill } from "./DateEndpointPill";
import { DateRangeFooter } from "./DateRangeFooter";
import { DateRangePresetsList } from "./DateRangePresetsList";

/**
 * Variantes del botón disparador siguiendo la estructura oficial de Tremor DatePicker (`triggerStyles`).
 */
const triggerStyles = tv({
  base: [
    "peer flex h-10 min-w-60 cursor-pointer appearance-none items-center gap-x-2 truncate rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400",
    focusInput,
  ],
  variants: {
    hasError: {
      true: hasErrorInput,
    },
  },
});

/**
 * Propiedades del componente coordinador DateRangePicker.
 */
export interface DateRangePickerProps extends VariantProps<typeof triggerStyles> {
  /** Rango de fechas seleccionado (controlado). */
  value?: DateRange;
  /** Callback emitido al confirmar el rango seleccionado. */
  onChange?: (dateRange: DateRange | undefined) => void;
  /** Texto mostrado cuando no hay fecha seleccionada. */
  placeholder?: string;
  /** Clases CSS adicionales para el botón disparador. */
  className?: string;
  /** Lista de atajos rápidos de selección. */
  presets?: DateRangePreset[];
  /** Deshabilita la interacción del selector. */
  disabled?: boolean;
  /** Número máximo de días permitidos en el rango (365 días máx.). */
  maxDays?: number;
  /** Prohíbe la selección de fechas futuras (fecha_hasta <= hoy). */
  disableFuture?: boolean;
  /** Número de meses visibles simultáneamente en el calendario. */
  numberOfMonths?: number;
  /** Identificador HTML para asociar con etiquetas Label (accesibilidad a11y). */
  id?: string;
  /** Alineación del Popover respecto al botón disparador. */
  align?: "start" | "center" | "end";
}

/**
 * Coordinador principal del selector de rango de fechas de Tremor y Shadcn UI adaptado a PriceScope.
 * Coordina `DateRangePresetsList`, `DateEndpointPill`, `Calendar` y `DateRangeFooter` con `useDateRangeDraft`.
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Seleccionar rango de fechas",
  className,
  presets: presetsProp,
  disabled = false,
  hasError = false,
  maxDays = 365,
  disableFuture = true,
  numberOfMonths = 1,
  align = "start",
  id,
}: DateRangePickerProps) {
  const {
    open,
    effectiveValue,
    draftRange,
    activeField,
    currentMonth,
    setCurrentMonth,
    today,
    presets,
    minHistoricalDate,
    disabledMatchers,
    selectedDayCount,
    handleOpenChange,
    handlePillClick,
    handleDaySelect,
    handlePresetSelect,
    handleApply,
    handleCancel,
    handleReset,
  } = useDateRangeDraft({ value, onChange, presets: presetsProp, maxDays, disableFuture });

  const formattedDisplay = React.useMemo(
    () => formatDateRangeLabel(effectiveValue, placeholder),
    [effectiveValue, placeholder]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          id={id}
          tremor-id="tremor-raw"
          aria-label={formattedDisplay}
          className={cx(triggerStyles({ hasError }), className)}
        >
          <RiCalendar2Line className="size-4 shrink-0 text-slate-500" />
          <span className="flex-1 truncate text-left font-medium tabular-nums">
            {formattedDisplay}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="flex max-h-[85vh] max-w-[95vw] flex-col sm:max-w-none sm:flex-row"
      >
        <DateRangePresetsList
          presets={presets}
          draftRange={draftRange}
          onSelect={handlePresetSelect}
        />

        <div
          className={cx(
            "flex flex-col",
            numberOfMonths === 1 ? "w-full sm:w-69" : "w-full sm:w-auto"
          )}
        >
          <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-slate-100 pb-2.5">
            <DateEndpointPill
              label="Desde"
              title="Clic para saltar al mes inicial y ajustar Fecha Desde"
              date={draftRange?.from}
              isActive={activeField === "from"}
              onClick={() => handlePillClick("from")}
            />
            <RiArrowRightLine className="size-3.5 shrink-0 text-slate-400" />
            <DateEndpointPill
              label="Hasta"
              title="Clic para saltar al mes final y ajustar Fecha Hasta"
              date={draftRange?.to}
              isActive={activeField === "to"}
              onClick={() => handlePillClick("to")}
            />
          </div>

          <div className="relative flex justify-center">
            <Calendar
              mode="range"
              selected={draftRange}
              onSelect={handleDaySelect}
              resetOnSelect={!activeField}
              numberOfMonths={numberOfMonths}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              startMonth={minHistoricalDate}
              endMonth={disableFuture ? today : undefined}
              max={maxDays}
              disabled={disabledMatchers}
            />
          </div>

          <DateRangeFooter
            selectedDayCount={selectedDayCount}
            maxDays={maxDays}
            canApply={Boolean(draftRange?.from && draftRange?.to)}
            onReset={handleReset}
            onCancel={handleCancel}
            onApply={handleApply}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
