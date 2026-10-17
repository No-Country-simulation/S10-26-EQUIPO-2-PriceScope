// Tremor DateRangePicker [v1.1.0] - PriceScope Senior UI/UX Edition
"use client"

import * as React from "react"
import * as PopoverPrimitives from "@radix-ui/react-popover"
import {
  RiCalendar2Line,
  RiArrowRightLine,
  RiRefreshLine,
} from "@remixicon/react"
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isSameDay,
  isBefore,
  isAfter,
  addDays,
  differenceInCalendarDays,
} from "date-fns"
import { es } from "date-fns/locale"
import { DayPicker, type DateRange, type Matcher } from "react-day-picker"

import { cx, focusInput } from "@/lib/utils"

export type { DateRange }

export interface DateRangePreset {
  label: string
  dateRange: {
    from: Date
    to: Date
  }
}

export interface DateRangePickerProps {
  /** Rango de fechas seleccionado (modo controlado) */
  value?: DateRange
  /** Rango de fechas por defecto (modo no controlado) */
  defaultValue?: DateRange
  /** Callback emitido cuando cambia la selección */
  onChange?: (dateRange: DateRange | undefined) => void
  /** Texto cuando no hay fecha seleccionada */
  placeholder?: string
  /** Clases CSS adicionales para el botón trigger */
  className?: string
  /** Lista de presets rápidos para la selección */
  presets?: DateRangePreset[]
  /** Deshabilita la interacción */
  disabled?: boolean
  /** Número máximo de días permitidos en el rango (RN-09: 365 días máx) */
  maxDays?: number
  /** Prohíbe la selección de fechas futuras (RN-09: fecha_hasta <= hoy) */
  disableFuture?: boolean
  /**
   * Número de meses mostrados simultáneamente.
   * Por recomendación Senior UX para analítica financiera, el default es 1 (reduce ruido visual y confusión).
   */
  numberOfMonths?: number
  /** Alineación del Popover respecto al trigger */
  align?: "start" | "center" | "end"
}

/**
 * Utilidad oficial para formatear fechas de API (YYYY-MM-DD)
 * sin sufrir desplazamiento de 1 día por conversión UTC (como toISOString en GMT-3).
 */
export function formatDateForApi(date: Date | undefined): string {
  if (!date) return ""
  return format(date, "yyyy-MM-dd")
}

export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  placeholder = "Seleccionar rango de fechas",
  className,
  presets,
  disabled = false,
  maxDays = 365,
  disableFuture = true,
  numberOfMonths = 1,
  align = "start",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Patrón controlado / no controlado idóneo para React 19 (sin useEffect redundante)
  const isControlled = value !== undefined
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(defaultValue)
  const range = isControlled ? value : internalRange

  // Permite enfocar intencionalmente si se está ajustando "Desde" o "Hasta"
  type ActiveField = "from" | "to" | null
  const [activeField, setActiveField] = React.useState<ActiveField>(null)

  const today = React.useMemo(() => endOfDay(new Date()), [])

  // Mes visible en el calendario (sincronizado con navegación inteligente)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => range?.to ?? range?.from ?? today)

  // Modificadores de deshabilitación: fechas futuras y límite de 365 días durante selección activa
  const disabledMatchers = React.useMemo<Matcher[]>(() => {
    const matchers: Matcher[] = []

    if (disableFuture) {
      matchers.push({ after: today })
    }

    // Si el usuario está seleccionando "Hasta" a partir de un "Desde" existente
    // Límite inclusivo: fecha_desde a fecha_desde + (maxDays - 1)
    if (activeField === "to" && range?.from && maxDays > 0) {
      matchers.push({ after: addDays(range.from, maxDays - 1) })
      matchers.push({ before: range.from })
    }

    // Si el usuario está seleccionando "Desde" hacia atrás a partir de un "Hasta" existente
    // Límite inclusivo: fecha_hasta - (maxDays - 1) a fecha_hasta
    if (activeField === "from" && range?.to && maxDays > 0) {
      matchers.push({ before: subDays(range.to, maxDays - 1) })
      matchers.push({ after: range.to })
    }

    return matchers
  }, [disableFuture, today, activeField, range, maxDays])

  // Manejador inteligente de clics en el calendario
  const handleDaySelect = (selectedRange: DateRange | undefined, triggerDate: Date | undefined) => {
    if (!triggerDate) return

    // Prevenir cualquier fecha futura
    if (disableFuture && isAfter(triggerDate, today)) {
      return
    }

    // CASO 1: Edición intencional del campo "Desde"
    if (activeField === "from") {
      let targetTo = range?.to
      if (targetTo) {
        if (isAfter(triggerDate, targetTo)) {
          targetTo = triggerDate
        } else if (differenceInCalendarDays(targetTo, triggerDate) + 1 > maxDays) {
          targetTo = addDays(triggerDate, maxDays - 1)
        }
      }
      const updatedRange: DateRange = { from: triggerDate, to: targetTo }
      if (!isControlled) setInternalRange(updatedRange)
      onChange?.(updatedRange)
      setActiveField(null)
      return
    }

    // CASO 2: Edición intencional del campo "Hasta"
    if (activeField === "to") {
      let targetFrom = range?.from
      if (targetFrom) {
        if (isBefore(triggerDate, targetFrom)) {
          targetFrom = triggerDate
        } else if (differenceInCalendarDays(triggerDate, targetFrom) + 1 > maxDays) {
          targetFrom = subDays(triggerDate, maxDays - 1)
        }
      }
      const updatedRange: DateRange = { from: targetFrom, to: triggerDate }
      if (!isControlled) setInternalRange(updatedRange)
      onChange?.(updatedRange)
      setActiveField(null)
      return
    }

    // CASO 3: Selección natural de rango (con resetOnSelect={true})
    let nextRange = selectedRange

    if (nextRange?.from && nextRange?.to) {
      const fromDate = nextRange.from
      let toDate = nextRange.to

      if (disableFuture && isAfter(toDate, today)) {
        toDate = today
      }

      if (differenceInCalendarDays(toDate, fromDate) + 1 > maxDays) {
        toDate = addDays(fromDate, maxDays - 1)
      }

      nextRange = { from: fromDate, to: toDate }
      setActiveField(null)
    } else if (nextRange?.from && !nextRange?.to) {
      // El usuario eligió fecha inicial; orientar a elegir fecha final
      setActiveField("to")
    }

    if (!isControlled) {
      setInternalRange(nextRange)
    }
    onChange?.(nextRange)
  }

  const handlePresetSelect = (preset: DateRangePreset) => {
    let targetRange = preset.dateRange

    if (disableFuture && isAfter(targetRange.to, today)) {
      targetRange = { from: targetRange.from, to: today }
    }
    if (differenceInCalendarDays(targetRange.to, targetRange.from) + 1 > maxDays) {
      targetRange = { from: targetRange.from, to: addDays(targetRange.from, maxDays - 1) }
    }

    if (!isControlled) {
      setInternalRange(targetRange)
    }
    onChange?.(targetRange)
    setCurrentMonth(targetRange.to)
    setActiveField(null)
    setOpen(false)
  }

  const isPresetActive = (preset: DateRangePreset) => {
    if (!range?.from || !range?.to) return false
    return (
      isSameDay(range.from, preset.dateRange.from) &&
      isSameDay(range.to, preset.dateRange.to)
    )
  }

  const selectedDayCount = React.useMemo(() => {
    if (!range?.from) return null
    if (!range?.to) return 1
    return Math.max(1, differenceInCalendarDays(range.to, range.from) + 1)
  }, [range])

  const formattedDisplay = React.useMemo(() => {
    if (!range?.from) return placeholder
    if (!range.to) {
      return format(range.from, "dd/MM/yyyy")
    }
    const days = Math.max(1, differenceInCalendarDays(range.to, range.from) + 1)
    return `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")} (${days}d)`
  }, [range, placeholder])

  const ariaDescription = React.useMemo(() => {
    if (range?.from && range?.to) {
      return `Rango de fechas seleccionado del ${format(range.from, "dd/MM/yyyy")} al ${format(range.to, "dd/MM/yyyy")}`
    }
    if (range?.from) {
      return `Fecha inicial seleccionada: ${format(range.from, "dd/MM/yyyy")}. Falta fecha final.`
    }
    return placeholder
  }, [range, placeholder])

  const handlePillClick = (field: "from" | "to") => {
    if (activeField === field) {
      setActiveField(null)
      return
    }
    setActiveField(field)
    // Sincronizar el mes visual con la fecha a editar
    if (field === "from" && range?.from) {
      setCurrentMonth(range.from)
    } else if (field === "to" && range?.to) {
      setCurrentMonth(range.to)
    }
  }

  return (
    <PopoverPrimitives.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitives.Trigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={ariaDescription}
          className={cx(
            "peer flex cursor-pointer appearance-none items-center gap-x-2 truncate rounded-md border px-3 py-2 text-sm shadow-xs transition-all min-w-[240px]",
            "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-50",
            "hover:bg-gray-50 dark:hover:bg-gray-950/50",
            "disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-900 dark:disabled:text-gray-600",
            focusInput,
            className
          )}
        >
          <RiCalendar2Line className="size-4 shrink-0 text-gray-500" />
          <span className="flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap font-medium">
            {formattedDisplay}
          </span>
        </button>
      </PopoverPrimitives.Trigger>

      <PopoverPrimitives.Portal>
        <PopoverPrimitives.Content
          sideOffset={8}
          align={align}
          className={cx(
            "z-50 flex flex-col sm:flex-row rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-800 dark:bg-gray-950 max-w-[95vw] sm:max-w-none overflow-y-auto max-h-[85vh]",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          {/* Columna Lateral / Superior de Presets */}
          {presets && presets.length > 0 && (
            <div className="flex flex-row flex-wrap sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-gray-200 pb-2 sm:pb-0 sm:pr-3 mb-2 sm:mb-0 sm:mr-1 min-w-40 sm:w-44 dark:border-gray-800">
              <div className="w-full px-2 py-1 mb-0.5">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Atajos Rápidos
                </span>
              </div>
              {presets.map((preset) => {
                const active = isPresetActive(preset)
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={cx(
                      "rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer",
                      active
                        ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-500/20"
                        : "font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <span>{preset.label}</span>
                    {active && <span className="size-1.5 rounded-full bg-blue-600 ml-2 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Sección Principal del Calendario con Ancho Estable */}
          <div className={cx("flex flex-col", numberOfMonths === 1 ? "w-full sm:w-[270px]" : "w-full sm:w-auto")}>
            {/* Píldoras Interactivas Desde ➔ Hasta con estructura vertical y tamaño fijo */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pb-2.5 mb-2 border-b border-gray-100 dark:border-gray-800">
              <button
                type="button"
                aria-pressed={activeField === "from"}
                onClick={() => handlePillClick("from")}
                className={cx(
                  "group flex flex-col justify-center text-left px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer min-w-0 select-none",
                  activeField === "from"
                    ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-xs"
                    : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/60 text-gray-700 dark:text-gray-300"
                )}
                title="Haz clic para modificar la fecha inicial"
              >
                <span className="text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
                  Fecha Desde
                </span>
                <span className="font-semibold text-xs mt-0.5 text-gray-900 dark:text-gray-100 truncate">
                  {range?.from ? format(range.from, "dd/MM/yyyy") : "Seleccionar"}
                </span>
                <div className="h-3.5 mt-0.5 flex items-center">
                  {activeField === "from" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 leading-none">
                      <span className="size-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                      Editando
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                      Cambiar
                    </span>
                  )}
                </div>
              </button>

              <RiArrowRightLine className="size-3.5 text-gray-400 shrink-0" />

              <button
                type="button"
                aria-pressed={activeField === "to"}
                onClick={() => handlePillClick("to")}
                className={cx(
                  "group flex flex-col justify-center text-left px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer min-w-0 select-none",
                  activeField === "to"
                    ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-xs"
                    : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/60 text-gray-700 dark:text-gray-300"
                )}
                title="Haz clic para modificar la fecha final"
              >
                <span className="text-[10px] uppercase font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
                  Fecha Hasta
                </span>
                <span className="font-semibold text-xs mt-0.5 text-gray-900 dark:text-gray-100 truncate">
                  {range?.to ? format(range.to, "dd/MM/yyyy") : "Seleccionar"}
                </span>
                <div className="h-3.5 mt-0.5 flex items-center">
                  {activeField === "to" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 leading-none">
                      <span className="size-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                      Editando
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                      Cambiar
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Calendario react-day-picker v10 con soporte de Español */}
            <div className="relative p-0.5 flex justify-center">
              <DayPicker
                locale={es}
                mode="range"
                selected={range}
                onSelect={handleDaySelect}
                resetOnSelect={true}
                numberOfMonths={numberOfMonths}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                endMonth={disableFuture ? today : undefined}
                max={maxDays}
                disabled={disabledMatchers}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-3 sm:space-x-4 sm:space-y-0",
                  month: "relative space-y-2",
                  month_caption: "flex justify-center h-8 items-center text-sm font-semibold text-gray-900 dark:text-gray-100",
                  caption_label: "text-sm font-semibold select-none capitalize",
                  nav: "flex items-center justify-between absolute top-0 inset-x-0 w-full pointer-events-none z-10 px-1",
                  button_previous: "h-7 w-7 bg-transparent p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100 rounded-md transition-colors pointer-events-auto flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer",
                  button_next: "h-7 w-7 bg-transparent p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100 rounded-md transition-colors pointer-events-auto flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer",
                  month_grid: "w-full border-collapse space-y-1",
                  weekdays: "flex text-gray-400 text-xs justify-around mb-1",
                  weekday: "w-8 font-normal text-center select-none text-[11px] capitalize",
                  week: "flex w-full mt-1 justify-around",
                  day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-8 h-8 flex items-center justify-center",
                  day_button: "h-8 w-8 p-0 font-normal rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-center text-sm flex items-center justify-center text-gray-800 dark:text-gray-200 cursor-pointer",
                  selected: "[&:not(.range-middle)]:bg-blue-600 [&:not(.range-middle)]:text-white hover:bg-blue-600 focus:bg-blue-600 rounded-md",
                  today: "font-bold text-blue-600 dark:text-blue-400",
                  outside: "!invisible pointer-events-none !bg-transparent",
                  disabled: "!text-gray-300 dark:!text-gray-700 !opacity-30 !cursor-not-allowed pointer-events-none",
                  range_middle: "[&:not([data-outside='true'])]:!bg-blue-50 [&:not([data-outside='true'])]:!text-blue-900 dark:[&:not([data-outside='true'])]:!bg-blue-950/40 dark:[&:not([data-outside='true'])]:!text-blue-200 !rounded-none font-normal",
                  range_start: "!rounded-r-none !rounded-l-md !bg-blue-600 !text-white font-medium",
                  range_end: "!rounded-l-none !rounded-r-md !bg-blue-600 !text-white font-medium",
                  hidden: "!invisible !bg-transparent",
                }}
              />
            </div>

            {/* Footer con información RN-09 y acción rápida de restablecer */}
            <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-2 px-1 text-[11px] text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                {selectedDayCount !== null ? (
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedDayCount} {selectedDayCount === 1 ? "día" : "días"}
                  </span>
                ) : (
                  <span className="text-gray-400">Sin rango</span>
                )}
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-[10px] text-gray-400">
                  Máx. {maxDays} días
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (presets && presets.length > 0) {
                    handlePresetSelect(presets[0])
                  } else {
                    if (!isControlled) setInternalRange(undefined)
                    onChange?.(undefined)
                  }
                  setActiveField(null)
                }}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                title="Restablecer selección"
              >
                <RiRefreshLine className="size-3" />
                <span>Restablecer</span>
              </button>
            </div>
          </div>
        </PopoverPrimitives.Content>
      </PopoverPrimitives.Portal>
    </PopoverPrimitives.Root>
  )
}

// Presets oficiales de PriceScope (respetando RN-09 de 365 días máx y cálculo inclusivo exacto)
export function getPriceScopePresets(referenceDate: Date = new Date()): DateRangePreset[] {
  const today = endOfDay(referenceDate)
  return [
    {
      label: "Última semana (7D)",
      dateRange: {
        from: startOfDay(subDays(today, 6)),
        to: today,
      },
    },
    {
      label: "Últimos 15 días (15D)",
      dateRange: {
        from: startOfDay(subDays(today, 14)),
        to: today,
      },
    },
    {
      label: "Últimos 30 días (30D)",
      dateRange: {
        from: startOfDay(subDays(today, 29)),
        to: today,
      },
    },
    {
      label: "Últimos 2 meses (60D)",
      dateRange: {
        from: startOfDay(subDays(today, 59)),
        to: today,
      },
    },
    {
      label: "Últimos 3 meses (90D)",
      dateRange: {
        from: startOfDay(subDays(today, 89)),
        to: today,
      },
    },
    {
      label: "Últimos 6 meses (180D)",
      dateRange: {
        from: startOfDay(subDays(today, 179)),
        to: today,
      },
    },
    {
      label: "Últimos 9 meses (270D)",
      dateRange: {
        from: startOfDay(subDays(today, 269)),
        to: today,
      },
    },
    {
      label: "Último año (1A)",
      dateRange: {
        from: startOfDay(subDays(today, 364)),
        to: today,
      },
    },
  ]
}
