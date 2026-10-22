import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { tv, type VariantProps } from "tailwind-variants";

import { cx, focusRing } from "@/lib/utils";

const buttonVariants = tv({
  base: [
    "relative inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-center font-semibold whitespace-nowrap transition-all duration-150 ease-out select-none",
    "active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
    focusRing,
  ],
  variants: {
    variant: {
      primary: "border-transparent bg-blue-600 text-white shadow-2xs hover:bg-blue-700",
      secondary:
        "border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900",
      light: "border-transparent bg-slate-100 text-slate-800 shadow-none hover:bg-slate-200/80",
      ghost:
        "border-transparent bg-transparent text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-800",
      destructive: "border-transparent bg-rose-600 text-white shadow-2xs hover:bg-rose-700",
    },
    size: {
      default: "h-10 px-3.5 py-2 text-xs",
      sm: "h-8 px-3 py-1.5 text-xs",
      xs: "h-6 rounded px-1.5 py-0.5 text-[11px] font-medium",
      icon: "size-9 p-0",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<"button">, VariantProps<typeof buttonVariants> {
  /** Muestra el hijo directo como contenedor mediante Radix Slot */
  asChild?: boolean;
}

/**
 * Primitivo Button de Tremor / Shadcn UI con variantes semánticas y micro-interacción táctil.
 */
function Button({
  asChild = false,
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      data-slot="button"
      type={asChild ? undefined : type}
      className={cx(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
