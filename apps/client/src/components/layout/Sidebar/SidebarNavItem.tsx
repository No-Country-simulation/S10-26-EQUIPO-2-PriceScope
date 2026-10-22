import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/StatusDot";
import { cx } from "@/lib/utils";

/**
 * Propiedades de cada enlace de navegación dentro del Sidebar.
 */
export interface SidebarNavItemProps {
  /** Ruta de destino del enlace. */
  href: string;
  /** Etiqueta visible cuando el menú está expandido. */
  label: string;
  /** Componente de icono asociado al módulo. */
  icon: React.ComponentType<{ className?: string }>;
  /** Indica si la ruta actual coincide con este enlace. */
  isActive: boolean;
  /** Indica si el Sidebar está en modo icono contraído. */
  isCollapsed: boolean;
  /** Color de acento del icono cuando la ruta está activa. */
  accent?: "blue" | "amber";
  /** Contador numérico opcional (ej. alertas activas). */
  badgeCount?: number;
}

/**
 * Ítem de navegación lateral sin reflujo de texto al abrir o cerrar (`size-10` fijo para el icono).
 */
export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
  accent = "blue",
  badgeCount,
}: SidebarNavItemProps) {
  const activeIconColor = accent === "amber" ? "text-amber-400" : "text-blue-400";
  const hasBadge = typeof badgeCount === "number" && badgeCount > 0;
  const fullLabel = hasBadge ? `${label} (${badgeCount})` : label;

  return (
    <li>
      <Link
        href={href}
        aria-label={fullLabel}
        title={isCollapsed ? fullLabel : undefined}
        className={cx(
          "relative flex h-10 w-full items-center overflow-hidden rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none",
          isActive
            ? "border border-slate-700/80 bg-slate-800/90 font-semibold text-white shadow-2xs"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        )}
      >
        <span className="absolute top-1/2 left-0 flex size-10 -translate-y-1/2 items-center justify-center">
          <span className="relative inline-flex">
            <Icon
              className={cx("size-4 shrink-0", isActive ? activeIconColor : "text-slate-400")}
            />
            {hasBadge && (
              <StatusDot
                variant="amber"
                size="sm"
                className="absolute -top-0.5 -right-0.5 hidden ring-2 ring-[#0a0f1d] group-data-[collapsible=icon]:block"
              />
            )}
          </span>
        </span>

        <span aria-hidden="true" className="w-10 shrink-0 group-data-[collapsible=icon]:hidden" />
        <span className="truncate group-data-[collapsible=icon]:hidden">{label}</span>

        {hasBadge ? (
          <Badge
            variant="amberDark"
            size="xs"
            className={cx(
              "absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full font-bold opacity-100 transition-opacity delay-100 duration-150 ease-linear group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0 group-data-[collapsible=icon]:duration-0",
              !isActive && "bg-amber-500/10 text-amber-400/80 ring-amber-500/20"
            )}
          >
            {badgeCount}
          </Badge>
        ) : (
          isActive && (
            <StatusDot
              variant="blue"
              size="xs"
              className="absolute top-1/2 right-3 -translate-y-1/2 group-data-[collapsible=icon]:hidden"
            />
          )
        )}
      </Link>
    </li>
  );
}
