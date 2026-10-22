"use client";

import * as React from "react";
import { es } from "date-fns/locale";
import { DayPicker, type DateRange } from "react-day-picker";

import { cx } from "@/lib/utils";

export type { DateRange };

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Primitivo Calendar de Tremor / Shadcn UI basado en `react-day-picker` v10.
 * Encapsula la localización en español (`es`) y las clases de grilla y rangos financieros.
 */
function Calendar({
  className,
  classNames,
  locale = es,
  showOutsideDays = false,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      data-slot="calendar"
      locale={locale}
      showOutsideDays={showOutsideDays}
      className={cx("p-0.5", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-3 sm:space-x-4 sm:space-y-0",
        month: "relative space-y-2",
        month_caption: "flex justify-center h-8 items-center text-sm font-bold text-slate-900",
        caption_label: "text-sm font-bold select-none capitalize text-slate-900",
        nav: "flex items-center justify-between absolute top-0 inset-x-0 w-full pointer-events-none z-10 px-1",
        button_previous:
          "h-7 w-7 bg-transparent p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors pointer-events-auto flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer",
        button_next:
          "h-7 w-7 bg-transparent p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors pointer-events-auto flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex text-slate-500 text-xs justify-around mb-1",
        weekday: "w-8 font-semibold text-center select-none text-[11px] capitalize text-slate-500",
        week: "flex w-full mt-1 justify-around",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-8 h-8 flex items-center justify-center text-slate-800",
        day_button:
          "h-8 w-8 p-0 font-medium rounded-md hover:bg-slate-100 hover:text-slate-800 transition-colors text-center text-sm flex items-center justify-center text-inherit cursor-pointer",
        selected: "bg-blue-600 text-white font-semibold rounded-md",
        today: "[&:not([data-selected])]:font-bold [&:not([data-selected])]:text-blue-600",
        outside: "invisible pointer-events-none",
        disabled: "text-slate-300 opacity-40 cursor-not-allowed pointer-events-none",
        range_middle: "bg-blue-50! text-blue-900! rounded-none! font-medium",
        range_start: "rounded-r-none! rounded-l-md! bg-blue-600! text-white! font-bold",
        range_end: "rounded-l-none! rounded-r-md! bg-blue-600! text-white! font-bold",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}

export { Calendar };
