import * as React from "react";

import { cx } from "@/lib/utils";

/**
 * Propiedades del componente Label oficial de Tremor y Shadcn UI.
 */
export interface LabelProps extends React.ComponentProps<"label"> {
  /** Aplica estilo visual de deshabilitado a la etiqueta. */
  disabled?: boolean;
}

/**
 * Componente Label oficial de Tremor y Shadcn UI para campos de formulario y filtros.
 */
function Label({ className, disabled = false, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      tremor-id="tremor-raw"
      aria-disabled={disabled}
      className={cx(
        "text-[11px] leading-none font-semibold tracking-wider text-slate-500 uppercase select-none",
        disabled && "cursor-not-allowed text-slate-400 opacity-70",
        className
      )}
      {...props}
    />
  );
}

export { Label };
