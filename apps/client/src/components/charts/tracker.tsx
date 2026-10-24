"use client";

import * as React from "react";
import * as PopoverPrimitives from "@radix-ui/react-popover";

import { cx } from "@/lib/utils";

/**
 * Propiedades de cada bloque individual dentro del componente Tracker de Tremor.
 */
export interface TrackerBlockProps {
  /** Identificador único del bloque temporal. */
  key?: string | number;
  /** Clase de color de fondo de Tailwind (ej. `bg-emerald-500`, `bg-amber-500`, `bg-rose-500`). */
  color?: string;
  /** Contenido descriptivo mostrado al inspeccionar el bloque. */
  tooltip?: React.ReactNode;
  /** Activa la atenuación visual al pasar el cursor sobre el bloque. */
  hoverEffect?: boolean;
  /** Color de respaldo cuando `color` no está definido. */
  defaultBackgroundColor?: string;
}

/**
 * Bloque individual del componente Tracker de Tremor con soporte de cartel informativo emergente.
 */
function Block({ color, tooltip, defaultBackgroundColor, hoverEffect = false }: TrackerBlockProps) {
  const [open, setOpen] = React.useState(false);

  const blockElement = (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="size-full overflow-hidden px-[0.5px] transition first:rounded-l-xs first:pl-0 last:rounded-r-xs last:pr-0 sm:px-px"
    >
      <div
        className={cx(
          "size-full rounded-[1px]",
          color || defaultBackgroundColor,
          hoverEffect ? "hover:opacity-60" : ""
        )}
      />
    </div>
  );

  if (!tooltip) {
    return blockElement;
  }

  return (
    <PopoverPrimitives.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitives.Trigger asChild>{blockElement}</PopoverPrimitives.Trigger>
      <PopoverPrimitives.Portal>
        <PopoverPrimitives.Content
          sideOffset={8}
          side="top"
          align="center"
          avoidCollisions
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={cx(
            "pointer-events-none z-50 w-auto rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-md outline-none"
          )}
        >
          {tooltip}
        </PopoverPrimitives.Content>
      </PopoverPrimitives.Portal>
    </PopoverPrimitives.Root>
  );
}

/**
 * Propiedades del componente Tracker oficial de Tremor.
 */
export interface TrackerProps extends React.ComponentProps<"div"> {
  /** Colección de bloques de estado temporal (`banda_calidad_diaria`). */
  data: TrackerBlockProps[];
  /** Color de fondo predeterminado cuando un bloque no especifica `color`. */
  defaultBackgroundColor?: string;
  /** Habilita efecto hover en cada bloque. */
  hoverEffect?: boolean;
}

/**
 * Componente oficial Tracker de Tremor para visualizar series de estados o disponibilidad diaria (`banda_calidad_diaria`).
 */
function Tracker({
  data = [],
  defaultBackgroundColor = "bg-slate-300",
  className,
  hoverEffect = true,
  ...props
}: TrackerProps) {
  return (
    <div
      data-slot="tracker"
      tremor-id="tremor-raw"
      className={cx("group flex h-8 w-full items-center", className)}
      {...props}
    >
      {data.map(({ key: itemKey, ...item }, index) => (
        <Block
          key={itemKey ?? index}
          defaultBackgroundColor={defaultBackgroundColor}
          hoverEffect={hoverEffect}
          {...item}
        />
      ))}
    </div>
  );
}

export { Tracker };
