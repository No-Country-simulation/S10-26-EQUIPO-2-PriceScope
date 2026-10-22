import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { RiSideBarLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";

/**
 * Propiedades de la cabecera de marca del Sidebar.
 */
export interface SidebarBrandHeaderProps {
  /** Indica si el menú lateral se encuentra contraído en modo icono. */
  isCollapsed: boolean;
  /** Callback para alternar entre estado expandido y contraído. */
  onToggle: () => void;
}

/**
 * Cabecera del Sidebar con isotipo fijo a la izquierda y botón secundario de colapso.
 */
export function SidebarBrandHeader({ isCollapsed, onToggle }: SidebarBrandHeaderProps) {
  const toggleLabel = isCollapsed ? "Abrir menú lateral" : "Contraer menú lateral";

  return (
    <div className="relative flex h-16 shrink-0 items-center border-b border-slate-800/70">
      <button
        type="button"
        aria-label={toggleLabel}
        title={`${toggleLabel} (Ctrl+B)`}
        onClick={onToggle}
        className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Image
          src="/isotipo.png"
          alt="PriceScope"
          width={36}
          height={36}
          className="size-9 shrink-0 object-contain"
          priority
        />
      </button>

      <Link
        href="/"
        className="absolute top-1/2 left-14 flex -translate-y-1/2 flex-col whitespace-nowrap group-data-[collapsible=icon]:hidden"
      >
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-base font-extrabold tracking-tight text-white">
            Price
            <span className="bg-linear-to-r from-blue-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Scope
            </span>
          </span>
          <Badge
            variant="cyanDark"
            size="xs"
            className="rounded px-1.5 py-0.5 text-[9px] font-bold"
          >
            B2B
          </Badge>
        </div>
        <span className="mt-1 text-[10px] font-semibold tracking-tight text-slate-400">
          Macro Inflation Monitor
        </span>
      </Link>

      <button
        type="button"
        onClick={onToggle}
        aria-label="Contraer menú lateral"
        title="Contraer menú lateral (Ctrl+B)"
        className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-colors group-data-[collapsible=icon]:hidden hover:bg-slate-800/70 hover:text-white"
      >
        <RiSideBarLine className="size-4" />
      </button>
    </div>
  );
}
