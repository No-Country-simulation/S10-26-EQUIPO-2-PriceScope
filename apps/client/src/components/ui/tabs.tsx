"use client";

import * as React from "react";

import { cx, focusRing } from "@/lib/utils";

/**
 * Variantes visuales oficiales de Tremor Tabs (`line` para pestañas inferiores y `solid` para control segmentado).
 */
export type TabsListVariant = "line" | "solid";

interface TabsContextValue {
  value: string;
  onValueChange: (nextValue: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);
const TabsListVariantContext = React.createContext<TabsListVariant>("solid");

/**
 * Propiedades del contenedor raíz Tabs de Tremor y Shadcn UI.
 */
export interface TabsProps extends React.ComponentProps<"div"> {
  /** Valor activo controlado. */
  value?: string;
  /** Valor activo inicial en modo no controlado. */
  defaultValue?: string;
  /** Callback ejecutado cuando cambia la pestaña activa. */
  onValueChange?: (value: string) => void;
}

/**
 * Contenedor raíz Tabs oficial de Tremor y Shadcn UI.
 */
function Tabs({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const currentValue = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [controlledValue, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div data-slot="tabs" tremor-id="tremor-raw" className={cx(className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

const variantStyles: Record<TabsListVariant, string> = {
  line: "flex items-center justify-start border-b border-slate-200",
  solid:
    "inline-flex items-center justify-center rounded-lg border border-slate-200/90 bg-slate-100 p-0.5",
};

/**
 * Propiedades de la lista de pestañas (`TabsList`) de Tremor y Shadcn UI.
 */
export interface TabsListProps extends React.ComponentProps<"div"> {
  /** Estilo visual de la barra de pestañas (`solid` por defecto o `line`). */
  variant?: TabsListVariant;
}

/**
 * Contenedor de disparadores de pestañas (`TabsList`) con soporte de variantes `solid` y `line` de Tremor.
 */
function TabsList({ className, variant = "solid", children, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      className={cx(variantStyles[variant], className)}
      {...props}
    >
      <TabsListVariantContext.Provider value={variant}>{children}</TabsListVariantContext.Provider>
    </div>
  );
}

/**
 * Devuelve las clases de estilo del disparador según la variante de `TabsList` en Tremor.
 */
function getTriggerVariantStyles(tabVariant: TabsListVariant): string {
  switch (tabVariant) {
    case "line":
      return cx(
        "-mb-px inline-flex cursor-pointer items-center justify-center gap-1.5 border-b-2 border-transparent px-3 pb-2 text-xs font-medium whitespace-nowrap text-slate-500 transition-all hover:border-slate-300 hover:text-slate-700",
        "data-[state=active]:border-blue-600 data-[state=active]:font-semibold data-[state=active]:text-blue-600",
        "disabled:pointer-events-none disabled:text-slate-300"
      );
    case "solid":
      return cx(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-xs font-medium whitespace-nowrap text-slate-500 transition-all hover:text-slate-900",
        "data-[state=active]:border-slate-200/70 data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs",
        "disabled:pointer-events-none disabled:text-slate-400 disabled:opacity-50"
      );
  }
}

/**
 * Propiedades del botón disparador (`TabsTrigger`) de Tremor y Shadcn UI.
 */
export interface TabsTriggerProps extends React.ComponentProps<"button"> {
  /** Identificador de la pestaña que activa este disparador. */
  value: string;
}

/**
 * Botón disparador individual (`TabsTrigger`) de Tremor y Shadcn UI.
 */
function TabsTrigger({ className, value, children, onClick, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  const variant = React.useContext(TabsListVariantContext);
  const isActive = context?.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      onClick={(event) => {
        context?.onValueChange(value);
        onClick?.(event);
      }}
      className={cx(getTriggerVariantStyles(variant), focusRing, className)}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Propiedades del panel de contenido (`TabsContent`) de Tremor y Shadcn UI.
 */
export interface TabsContentProps extends React.ComponentProps<"div"> {
  /** Identificador de la pestaña asociada a este contenido. */
  value: string;
}

/**
 * Panel de contenido asociado a una pestaña activa (`TabsContent`).
 */
function TabsContent({ className, value, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (context?.value !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      data-slot="tabs-content"
      data-state="active"
      className={cx("outline-none", focusRing, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
