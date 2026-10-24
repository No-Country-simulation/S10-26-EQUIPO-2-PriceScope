"use client";

import React, { useState } from "react";
import {
  RiDatabase2Line,
  RiInformationLine,
  RiScales3Line,
  RiShieldCheckLine,
} from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface LegalNoticeModalProps {
  isCollapsed?: boolean;
}

/**
 * Modal oficial de Aviso Legal, Fair Use y Descargo Financiero B2B
 * adaptado a la Fase 1 (sin recolección de datos personales ni cookies de tracking).
 */
export function LegalNoticeModal({ isCollapsed = false }: LegalNoticeModalProps) {
  const [open, setOpen] = useState(false);

  const triggerContent = isCollapsed ? (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Aviso Legal y Condiciones"
            className="flex size-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            <RiScales3Line className="size-4.5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Aviso Legal y Condiciones
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
    >
      <RiScales3Line className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="truncate">Aviso Legal y Condiciones</span>
      <Badge
        variant="neutral"
        size="xs"
        className="ml-auto border-slate-700 bg-slate-800 text-[10px] text-slate-400"
      >
        B2B
      </Badge>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerContent}</DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <RiShieldCheckLine className="size-5" aria-hidden="true" />
            <DialogTitle>Términos de Uso y Aviso Legal</DialogTitle>
          </div>
          <DialogDescription>
            PriceScope — Monitor de Inflación Real Multimoneda (Fase 1 / Simulación Laboral)
          </DialogDescription>
        </DialogHeader>

        {/* Contenido con scroll interno controlado */}
        <div className="mt-3 max-h-[55vh] space-y-4 overflow-y-auto pr-2 text-xs leading-relaxed text-slate-600">
          {/* Sección 1: Naturaleza y Descargo Financiero */}
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <RiInformationLine className="size-4 text-blue-600" />
              <span>1. Finalidad Informativa y Exención de Responsabilidad</span>
            </div>
            <p>
              PriceScope es una plataforma de analítica económica y visualización estadística
              diseñada para la investigación de mercado y seguimiento de precios. La información
              provista <strong>no constituye asesoramiento financiero, legal o contable</strong>.
              Las decisiones corporativas o de inversión tomadas con base en las series temporales
              son de exclusiva responsabilidad del usuario.
            </p>
          </div>

          {/* Sección 2: Relevamiento Ético de Datos Públicos (Fair Use) */}
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <RiDatabase2Line className="size-4 text-emerald-600" />
              <span>2. Relevamiento de Datos Públicos y Marcas Registradas</span>
            </div>
            <p>
              Los precios relevados provienen exclusivamente de góndolas digitales de acceso
              público. Las marcas comerciales, logotipos, nombres de fantasía y publicaciones
              minoristas (ej. Carrefour, Jumbo, Frávega, Musimundo, La Virginia, Natura, etc.) son
              propiedad exclusiva de sus respectivos titulares.
            </p>
            <p className="text-[11px] text-slate-500">
              Su mención en este sitio se realiza bajo la doctrina de{" "}
              <em>Uso Legítimo Nominativo</em> (Nominative Fair Use) con fines puramente de
              identificación, comparativos y estadísticos, sin que exista patrocinio o vínculo
              societario directo.
            </p>
          </div>

          {/* Sección 3: Política de Cero Tracking en Fase 1 */}
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <RiShieldCheckLine className="size-4 text-purple-600" />
              <span>3. Privacidad y Tratamiento de Datos (Fase 1)</span>
            </div>
            <p>
              Durante la actual Fase 1 (MVP de lectura y auditoría),{" "}
              <strong>
                la plataforma no recolecta datos personales, no solicita registros de usuario, ni
                utiliza cookies de rastreo comercial
              </strong>
              . Las preferencias temporales (filtros activos y estado de la barra lateral) se
              conservan de forma estrictamente local en el navegador del usuario.
            </p>
          </div>

          {/* Sección 4: Fuentes Cambiarias y Metodología */}
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <RiScales3Line className="size-4 text-amber-600" />
              <span>4. Fuentes Cambiarias y Fallback Algorítmico</span>
            </div>
            <p>
              Las cotizaciones de referencia (Dólar Blue y Oficial) son provistas por APIs externas
              abiertas (DolarAPI / BCRA) con hora de corte fijada a las 23:59:59 ART. Ante feriados
              o contingencias de red, el sistema implementa una política de tolerancia técnica (TTL
              72 horas) señalizada explícitamente como aproximación en la interfaz.
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
