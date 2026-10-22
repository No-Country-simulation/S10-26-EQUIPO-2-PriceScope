"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiDatabase2Line, RiSideBarLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { StatusDot } from "@/components/ui/StatusDot";

import { useSidebar } from "@/hooks/useSidebar";

export interface HeaderProps {
  /** Etiqueta de hora de la última sincronización exitosa */
  lastUpdatedLabel?: string;
  /** Cantidad de tiendas piloto activas en el sistema */
  monitoredStoresCount?: number;
  /** Etiqueta regional del entorno analítico */
  regionLabel?: string;
}

/**
 * Resuelve el título de la vista activa a partir de la ruta actual (`pathname`).
 */
export function getViewTitle(pathname: string): string {
  if (pathname === "/" || pathname === "/dashboard") {
    return "Tablero Macroeconómico de Inflación";
  }
  if (pathname.includes("/traceability") || pathname.startsWith("/products")) {
    return "Ficha de Producto y Trazabilidad";
  }
  if (pathname.startsWith("/alerts")) {
    return "Módulo de Alertas de Inflación";
  }
  return "Monitor Analítico";
}

/**
 * Cabecera superior del layout principal construida sobre Breadcrumb y Badges
 * con indicadores de frescura de datos del sistema.
 */
export function Header({
  lastUpdatedLabel: propLastUpdated,
  monitoredStoresCount: propMonitoredCount,
  regionLabel = "Argentina B2B",
}: HeaderProps) {
  const pathname = usePathname();
  const currentViewTitle = getViewTitle(pathname);
  const {
    lastUpdatedLabel: contextLastUpdated,
    pilotStores,
    toggleSidebar,
    isCollapsed,
  } = useSidebar();

  const effectiveLastUpdated = propLastUpdated ?? contextLastUpdated;
  const effectiveStoresCount = propMonitoredCount ?? pilotStores.length;

  return (
    <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb oficial de Shadcn UI + Etiqueta de Contexto */}
      {/* Botón móvil de navegación + Breadcrumb oficial de Shadcn UI */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expandir menú de navegación" : "Contraer menú de navegación"}
          title={isCollapsed ? "Expandir menú lateral (Ctrl+B)" : "Contraer menú lateral (Ctrl+B)"}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none lg:hidden"
        >
          <RiSideBarLine className="size-4" aria-hidden="true" />
        </button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">PriceScope</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-40 truncate sm:max-w-64 lg:max-w-none">
                {currentViewTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Badge variant="teal" className="hidden font-semibold lg:inline-flex">
          {regionLabel}
        </Badge>
      </div>

      {/* Indicadores de Sistema */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Frescura de Datos */}
        <div className="flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-600 sm:px-3">
          <StatusDot variant="emerald" size="sm" ping />
          <span className="text-[11px] font-medium tabular-nums">
            <span className="hidden sm:inline">Últ. actualización: </span>
            <strong className="text-slate-800">{effectiveLastUpdated}</strong>
          </span>
        </div>

        {/* Cobertura de Monitoreo */}
        <div className="hidden h-8 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-[11px] text-slate-500 sm:flex">
          <RiDatabase2Line className="size-3.5 text-blue-600" />
          <span className="tabular-nums">{effectiveStoresCount} Tiendas Monitoreadas</span>
        </div>
      </div>
    </header>
  );
}
