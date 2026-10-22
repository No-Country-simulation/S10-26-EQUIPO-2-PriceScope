import * as React from "react";
import { RiBuilding4Line, RiShieldCheckLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";

const UPCOMING_PHASE_ITEMS = [
  { id: "stores-panel", label: "Panel de Tiendas", icon: RiBuilding4Line, phase: "1.5" },
  { id: "gray-zone", label: "Zona Gris", icon: RiShieldCheckLine, phase: "1.5" },
] as const;

/**
 * Sección informativa de módulos planificados para la Fase 1.5 (Buffer Condicional).
 */
export function SidebarUpcomingPhase() {
  return (
    <div className="space-y-1 whitespace-nowrap opacity-45 transition-opacity delay-75 duration-150 ease-linear group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:opacity-0">
      <p className="px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
        Próxima Fase (1.5)
      </p>
      {UPCOMING_PHASE_ITEMS.map(({ id, label, icon: Icon, phase }) => (
        <div
          key={id}
          className="flex h-8 items-center justify-between px-2.5 text-xs text-slate-400"
        >
          <span className="flex items-center gap-2.5">
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
          </span>
          <Badge
            variant="slateDark"
            size="xs"
            className="rounded px-1.5 py-0.5 text-[9px] text-slate-500"
          >
            {phase}
          </Badge>
        </div>
      ))}
    </div>
  );
}
