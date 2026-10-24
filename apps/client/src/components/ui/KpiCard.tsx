import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cx } from "@/lib/utils";

const iconBoxVariants = tv({
  base: "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
  variants: {
    accent: {
      blue: "bg-blue-50 text-blue-600",
      emerald: "bg-emerald-50 text-emerald-600",
      amber: "bg-amber-50 text-amber-600",
      purple: "bg-purple-50 text-purple-600",
      rose: "bg-rose-50 text-rose-600",
      slate: "bg-slate-100 text-slate-700",
    },
  },
  defaultVariants: {
    accent: "blue",
  },
});

export interface KpiCardProps extends VariantProps<typeof iconBoxVariants> {
  /** Título superior del indicador (ej. "Variación ARS") */
  title: string;
  /** Valor numérico principal del KPI (ej. "+25.0%"). Si es null/undefined, muestra estado sin datos */
  metric: string | null | undefined;
  /** Descripción breve bajo el valor principal */
  subtitle: string;
  /** Ícono o símbolo corto que se muestra en la esquina superior derecha */
  icon?: React.ReactNode;
  /** Tooltip explicativo para el ícono superior */
  iconTooltip?: string;
  /** Contenido de la etiqueta de tendencia o estado junto a la métrica */
  badgeText?: React.ReactNode;
  /** Variante semántica de color para el Badge */
  badgeVariant?: BadgeProps["variant"];
  /** Etiqueta izquierda en el pie de la tarjeta */
  footerLabel?: string;
  /** Valor derecho en el pie de la tarjeta */
  footerValue?: React.ReactNode;
  /** Color semántico opcional para resaltar el valor del pie */
  footerValueClassName?: string;
  /** Activa el estado de carga (Skeleton) con altura fija para prevenir CLS (< 0.1) */
  isLoading?: boolean;
  /** Clases CSS adicionales para el contenedor Card */
  className?: string;
}

/**
 * Estructura de carga (Skeleton) de KpiCard utilizando el primitivo Skeleton de Shadcn UI.
 */
function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cx("justify-between", className)} aria-busy="true">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2.5">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="size-6 bg-slate-100" />
      </CardHeader>
      <CardContent className="pb-3.5">
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-8 w-28 rounded" />
          <Skeleton className="h-5 w-14 bg-slate-100" />
        </div>
        <Skeleton className="mt-2 h-3.5 w-44 rounded bg-slate-100" />
      </CardContent>
      <CardFooter className="justify-between border-t border-slate-100 pt-2.5">
        <Skeleton className="h-3 w-24 rounded bg-slate-100" />
        <Skeleton className="h-3 w-16 rounded" />
      </CardFooter>
    </Card>
  );
}

/**
 * Tarjeta ejecutiva de KPI construida sobre los primitivos Card, Skeleton (Shadcn UI) y Badge (Tremor).
 * Estandariza la presentación de métricas macroeconómicas con cifras tabulares (`tabular-nums`),
 * protección contra desbordamiento de texto (`truncate`) y estado Skeleton anti-CLS.
 */
export function KpiCard({
  title,
  metric,
  subtitle,
  icon,
  iconTooltip,
  accent = "blue",
  badgeText,
  badgeVariant = "neutral",
  footerLabel,
  footerValue,
  footerValueClassName,
  isLoading = false,
  className,
}: KpiCardProps) {
  if (isLoading) {
    return <KpiCardSkeleton className={className} />;
  }

  const hasValidMetric = metric !== null && metric !== undefined && metric !== "";

  return (
    <Card className={cx("justify-between", className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2.5">
        <span className="truncate text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        {icon && (
          <span title={iconTooltip} className={iconBoxVariants({ accent })}>
            {icon}
          </span>
        )}
      </CardHeader>

      <CardContent className="pb-3.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <span
            className={cx(
              "text-2xl font-bold tracking-tight tabular-nums",
              hasValidMetric ? "text-slate-900" : "text-slate-400"
            )}
          >
            {hasValidMetric ? metric : "--"}
          </span>
          {hasValidMetric ? (
            badgeText && <Badge variant={badgeVariant}>{badgeText}</Badge>
          ) : (
            <Badge variant="neutral">Sin datos suficientes</Badge>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-slate-500" title={subtitle}>
          {subtitle}
        </p>
      </CardContent>

      {(footerLabel || footerValue) && (
        <CardFooter className="justify-between gap-2 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
          <span className="truncate">{footerLabel}</span>
          <span
            className={cx(
              "shrink-0 font-semibold text-slate-800 tabular-nums",
              footerValueClassName
            )}
          >
            {footerValue}
          </span>
        </CardFooter>
      )}
    </Card>
  );
}
