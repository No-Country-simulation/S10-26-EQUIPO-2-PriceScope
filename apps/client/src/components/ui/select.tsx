"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { RiArrowDownSLine, RiArrowUpSLine, RiCheckLine } from "@remixicon/react";

import { cx, focusInput, hasErrorInput } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

/**
 * Estilos base del botón disparador siguiendo la estructura oficial de Tremor Select y Shadcn UI.
 */
const selectTriggerStyles = [
  cx(
    "group flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium whitespace-nowrap text-slate-800 shadow-2xs transition-colors select-none hover:bg-slate-50 data-placeholder:text-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 [&>span]:line-clamp-1",
    focusInput
  ),
];

/**
 * Propiedades del disparador del Select con soporte de estado de error de Tremor (`hasError`).
 */
interface SelectTriggerProps extends React.ComponentProps<typeof SelectPrimitive.Trigger> {
  /** Aplica el anillo y borde de validación de error de Tremor. */
  hasError?: boolean;
}

/**
 * Botón disparador del componente Select de Tremor y Shadcn UI adaptado a la paleta de PriceScope.
 */
function SelectTrigger({ className, hasError = false, children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cx(selectTriggerStyles, hasError ? hasErrorInput : "", className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <RiArrowDownSLine className="size-4 shrink-0 text-slate-500 transition-transform duration-150 group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/**
 * Botón de desplazamiento superior dentro del menú desplegable del Select.
 */
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cx(
        "flex cursor-default items-center justify-center py-1 text-slate-500",
        className
      )}
      {...props}
    >
      <RiArrowUpSLine className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

/**
 * Botón de desplazamiento inferior dentro del menú desplegable del Select.
 */
function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cx(
        "flex cursor-default items-center justify-center py-1 text-slate-500",
        className
      )}
      {...props}
    >
      <RiArrowDownSLine className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

/**
 * Contenedor flotante con las opciones desplegables del Select.
 */
function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={6}
        className={cx(
          "data-[side=bottom]:animate-slide-down-and-fade data-[side=top]:animate-slide-up-and-fade data-[state=closed]:animate-hide relative z-50 max-h-80 min-w-32 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl outline-none",
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cx(
            "p-1.5",
            position === "popper" &&
              "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/**
 * Etiqueta de sección para agrupar opciones dentro del Select.
 */
function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cx(
        "px-2.5 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase",
        className
      )}
      {...props}
    />
  );
}

/**
 * Opción individual seleccionable dentro del menú desplegable del Select.
 */
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cx(
        "relative flex w-full cursor-pointer items-center rounded-lg py-1.5 pr-8 pl-2.5 text-xs font-medium text-slate-700 outline-none select-none focus:bg-slate-100 focus:text-slate-900 data-disabled:pointer-events-none data-disabled:opacity-40 data-[state=checked]:bg-blue-50/80 data-[state=checked]:font-semibold data-[state=checked]:text-blue-700",
        className
      )}
      {...props}
    >
      <span className="absolute right-2.5 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <RiCheckLine className="size-3.5 text-blue-600" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/**
 * Línea divisoria horizontal entre grupos de opciones del Select.
 */
function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cx("-mx-1 my-1 h-px bg-slate-100", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
