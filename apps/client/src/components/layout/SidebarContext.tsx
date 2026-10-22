"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { getAlertsData } from "@/services/alerts.service";
import { getDashboardData } from "@/services/dashboard.service";

export interface PilotStoreItem {
  id: string;
  name: string;
  lastRun: string;
}

export const DEFAULT_PILOT_STORES: readonly PilotStoreItem[] = [
  { id: "carrefour", name: "Carrefour", lastRun: "14:00 ART" },
  { id: "jumbo", name: "Jumbo", lastRun: "14:05 ART" },
  { id: "fravega", name: "Frávega", lastRun: "14:10 ART" },
  { id: "musimundo", name: "Musimundo", lastRun: "14:15 ART" },
];

function formatUtcToArtTime(utcIsoString: string): string {
  try {
    const date = new Date(utcIsoString);
    if (isNaN(date.getTime())) return "14:00 ART";
    const hours = (date.getUTCHours() - 3 + 24) % 24;
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const hh = hours.toString().padStart(2, "0");
    return `${hh}:${minutes} ART`;
  } catch {
    return "14:00 ART";
  }
}

export interface SidebarContextType {
  /** Estado booleano corto: true cuando está colapsado a modo icono */
  isCollapsed: boolean;
  /** Estado booleano equivalente al estándar de Shadcn Sidebar (`!isCollapsed`) */
  open: boolean;
  /** Estado textual para selectores CSS `data-state` ("expanded" | "collapsed") */
  state: "expanded" | "collapsed";
  /** Alterna entre estado expandido y colapsado */
  toggleSidebar: () => void;
  /** Fija explícitamente el estado colapsado */
  setCollapsed: (collapsed: boolean) => void;
  /** Tiendas piloto monitoreadas en tiempo real */
  pilotStores: readonly PilotStoreItem[];
  /** Actualiza las tiendas piloto con los datos del backend */
  setPilotStores: (stores: readonly PilotStoreItem[]) => void;
  /** Etiqueta de última sincronización general del sistema */
  lastUpdatedLabel: string;
  /** Actualiza la etiqueta de sincronización general */
  setLastUpdatedLabel: (label: string) => void;
  /** Cantidad de alertas críticas activas mostradas en el badge */
  alertCount: number;
  /** Actualiza la cantidad de alertas críticas */
  setAlertCount: (count: number) => void;
}

export const SidebarContext = createContext<SidebarContextType | null>(null);

/**
 * Proveedor de estado para la barra lateral (Sidebar) con soporte de atajo de teclado (Ctrl+B / Cmd+B)
 * y colapso automático en pantallas menores a 1024px mediante `matchMedia`.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pilotStores, setPilotStores] = useState<readonly PilotStoreItem[]>(DEFAULT_PILOT_STORES);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string>("Hoy 14:00 ART");
  const [alertCount, setAlertCount] = useState<number>(3);

  useEffect(() => {
    let isCancelled = false;

    // Sincronizar tiendas y frescura general desde la API
    getDashboardData()
      .then((dashRes) => {
        if (!isCancelled && dashRes.pipeline_status?.tiendas) {
          const apiStores = dashRes.pipeline_status.tiendas.map((store) => ({
            id: store.tienda_id,
            name: store.nombre,
            lastRun: formatUtcToArtTime(store.ultima_corrida_utc),
          }));
          setPilotStores(apiStores);

          if (dashRes.pipeline_status.frescura_general_utc) {
            const timeLabel = formatUtcToArtTime(dashRes.pipeline_status.frescura_general_utc);
            setLastUpdatedLabel(`Hoy ${timeLabel}`);
          }
        }
      })
      .catch(() => {});

    // Sincronizar cantidad de alertas críticas desde la API
    getAlertsData({ limit: 50 })
      .then((res) => {
        if (!isCancelled) {
          const criticals = res.alertas.filter((a) => a.diferencial_puntos > 10).length;
          setAlertCount(criticals);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setIsCollapsed(true);
      }
    };

    handleMediaChange(mediaQuery);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const contextValue = useMemo<SidebarContextType>(
    () => ({
      isCollapsed,
      open: !isCollapsed,
      state: isCollapsed ? "collapsed" : "expanded",
      toggleSidebar,
      setCollapsed: setIsCollapsed,
      pilotStores,
      setPilotStores,
      lastUpdatedLabel,
      setLastUpdatedLabel,
      alertCount,
      setAlertCount,
    }),
    [isCollapsed, toggleSidebar, pilotStores, lastUpdatedLabel, alertCount]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "3.5rem",
          } as React.CSSProperties
        }
        className="group/sidebar-wrapper flex h-screen w-full overflow-hidden"
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export { useSidebar } from "@/hooks/useSidebar";
