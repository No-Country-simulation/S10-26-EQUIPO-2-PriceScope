import * as React from "react";

import { StatusDot } from "@/components/ui/StatusDot";

/**
 * Datos de una tienda piloto monitoreada en la Fase 1.
 */
export interface PilotStoreItem {
  /** Identificador único de la tienda. */
  id: string;
  /** Nombre comercial visible. */
  name: string;
  /** Hora de última sincronización en ART. */
  lastRun: string;
}

/**
 * Propiedades del bloque de tiendas piloto en el Sidebar.
 */
export interface SidebarPilotStoresProps {
  /** Lista de tiendas piloto monitoreadas. */
  stores: readonly PilotStoreItem[];
}

/**
 * Widget de estado en vivo para las tiendas piloto monitoreadas.
 */
export function SidebarPilotStores({ stores }: SidebarPilotStoresProps) {
  const count = stores.length;

  return (
    <div>
      {/* Vista colapsada (icono de pulso centrado en los 40px) */}
      <div
        className="hidden h-10 w-10 flex-col items-center justify-center gap-1 rounded-lg bg-slate-900/60 group-data-[collapsible=icon]:flex"
        title={`${count} Tiendas Monitoreadas En Vivo`}
      >
        <StatusDot variant="emeraldLight" size="sm" pulse />
        <span className="text-[9px] leading-none font-bold text-slate-400 tabular-nums">
          {count}/{count}
        </span>
      </div>

      {/* Vista expandida (con opacidad sincronizada para no deformar las letras al cerrar) */}
      <div className="space-y-2 whitespace-nowrap opacity-100 transition-opacity delay-75 duration-150 ease-linear group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:opacity-0">
        <div className="flex items-center justify-between px-2.5">
          <span className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            Tiendas Monitoreadas
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
            <StatusDot variant="emeraldLight" size="xs" pulse />
            {count} En vivo
          </span>
        </div>

        <div className="divide-y divide-slate-800/50 rounded-lg border border-slate-800/80 bg-slate-900/60 text-xs">
          {stores.map((store) => (
            <div
              key={store.id}
              className="flex items-center justify-between px-3 py-2 text-slate-300"
            >
              <span className="truncate">{store.name}</span>
              <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                {store.lastRun}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
