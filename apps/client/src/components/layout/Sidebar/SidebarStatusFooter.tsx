import * as React from "react";

import { StatusDot } from "@/components/ui/StatusDot";

/**
 * Pie del Sidebar con el estado global del motor de scraping forense.
 */
export function SidebarStatusFooter() {
  return (
    <div className="relative flex h-12 shrink-0 items-center border-t border-slate-800/80 bg-slate-950/40 px-2">
      <span
        title="Monitoreo Sincronizado"
        className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 items-center justify-center"
      >
        <StatusDot variant="emerald" size="sm" />
      </span>
      <span aria-hidden="true" className="w-10 shrink-0 group-data-[collapsible=icon]:hidden" />
      <span className="truncate text-[11px] font-medium whitespace-nowrap text-slate-400 group-data-[collapsible=icon]:hidden">
        Monitoreo Sincronizado
      </span>
    </div>
  );
}
