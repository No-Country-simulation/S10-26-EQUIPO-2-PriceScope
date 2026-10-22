import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

import { cx } from "@/lib/utils";

const calloutVariants = tv({
  base: "flex flex-col overflow-hidden rounded-lg border p-3.5 text-xs transition-all",
  variants: {
    variant: {
      default: ["border-blue-200 bg-blue-50/80 text-blue-900"],
      success: ["border-emerald-200 bg-emerald-50/80 text-emerald-900"],
      error: ["border-rose-200 bg-rose-50/80 text-rose-900"],
      warning: ["border-amber-200 bg-amber-50/80 text-amber-900"],
      neutral: ["border-slate-200 bg-slate-50/80 text-slate-900"],
      purple: ["border-purple-200 bg-purple-50/80 text-purple-900"],
      teal: ["border-teal-200 bg-teal-50/80 text-teal-900"],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CalloutProps
  extends React.ComponentPropsWithoutRef<"div">, VariantProps<typeof calloutVariants> {
  title: string;
  icon?: React.ElementType | React.ReactElement;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
}

/**
 * Componente Callout oficial de Tremor adaptado a la paleta clara de PriceScope
 * para tarjetas de avisos contextuales, hitos de mercado y alertas de reduflación.
 */
const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  (
    { title, icon: Icon, badge, meta, className, variant, children, ...props }: CalloutProps,
    forwardedRef
  ) => {
    return (
      <div
        ref={forwardedRef}
        className={cx(calloutVariants({ variant }), className)}
        tremor-id="tremor-raw"
        {...props}
      >
        {(badge || meta) && (
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>{badge}</div>
            {meta && <span className="text-[11px] font-medium text-slate-400">{meta}</span>}
          </div>
        )}
        <div className={cx("flex items-start")}>
          {Icon && typeof Icon === "function" ? (
            <Icon className={cx("mr-1.5 size-4 shrink-0")} aria-hidden="true" />
          ) : (
            Icon
          )}
          <span className={cx("font-bold text-slate-900")}>{title}</span>
        </div>
        <div
          className={cx("overflow-y-auto leading-relaxed text-slate-600", children ? "mt-1" : "")}
        >
          {children}
        </div>
      </div>
    );
  }
);

Callout.displayName = "Callout";

export { Callout, calloutVariants };
