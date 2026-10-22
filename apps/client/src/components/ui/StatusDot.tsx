import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

import { cx } from "@/lib/utils";

const statusDotVariants = tv({
  base: "inline-flex shrink-0 rounded-full",
  variants: {
    variant: {
      emerald: "bg-emerald-500",
      emeraldLight: "bg-emerald-400",
      amber: "bg-amber-400",
      blue: "bg-blue-400",
      rose: "bg-rose-500",
      slate: "bg-slate-400",
    },
    size: {
      xs: "size-1.5",
      sm: "size-2",
      md: "size-2.5",
    },
    pulse: {
      true: "animate-pulse",
      false: "",
    },
  },
  defaultVariants: {
    variant: "emerald",
    size: "sm",
    pulse: false,
  },
});

export interface StatusDotProps
  extends React.ComponentPropsWithoutRef<"span">, VariantProps<typeof statusDotVariants> {
  /** Activa una onda expansiva (`animate-ping`) alrededor del punto para indicadores en tiempo real */
  ping?: boolean;
}

/**
 * Indicador puntual de estado operativo o frescura de datos.
 * Soporta animación suave (`pulse`) o radar en vivo (`ping`) reutilizable en Sidebar, Header y tablas.
 */
export function StatusDot({
  className,
  variant = "emerald",
  size = "sm",
  pulse = false,
  ping = false,
  ...props
}: StatusDotProps) {
  if (ping) {
    return (
      <span
        className={cx("relative inline-flex", statusDotVariants({ size }), className)}
        {...props}
      >
        <span
          className={cx(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            statusDotVariants({ variant, size })
          )}
        />
        <span className={cx("relative", statusDotVariants({ variant, size }))} />
      </span>
    );
  }

  return (
    <span
      data-slot="status-dot"
      className={cx(statusDotVariants({ variant, size, pulse }), className)}
      {...props}
    />
  );
}
