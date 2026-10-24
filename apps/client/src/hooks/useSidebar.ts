import { useContext } from "react";
import { SidebarContext, type SidebarContextType } from "@/components/layout/SidebarContext";

/**
 * Hook para consumir el estado y acciones del Sidebar dentro de `SidebarProvider`.
 */
export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar debe utilizarse dentro de un SidebarProvider.");
  }
  return context;
}
