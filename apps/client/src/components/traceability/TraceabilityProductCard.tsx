import React, { useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiCheckDoubleLine,
  RiExternalLinkLine,
  RiFileTextLine,
  RiScales3Line,
} from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimestampToART } from "@/lib/traceability/formatters";
import type { HitoReduflacionItem, ProductoCanonicoDetalle } from "@/types/api";

export interface TraceabilityProductCardProps {
  product: ProductoCanonicoDetalle;
  hitosReduflacion?: HitoReduflacionItem[];
  externalStoreUrl?: string | null;
}

/**
 * Ficha técnica canónica del producto con desglose de atributos técnicos,
 * botón estilizado para auditar publicación en tienda y visualización dinámica
 * de hitos de reduflación conforme a la respuesta de la API.
 */
export function TraceabilityProductCard({
  product,
  hitosReduflacion = [],
  externalStoreUrl,
}: TraceabilityProductCardProps) {
  const [showAllHitos, setShowAllHitos] = useState(false);

  const hasHitos = hitosReduflacion.length > 0;
  const latestHito = hasHitos ? hitosReduflacion[0] : null;
  const olderHitos = hasHitos ? hitosReduflacion.slice(1) : [];

  return (
    <div className="space-y-4">
      {/* Visualización dinámica de hitos de reduflación desde la API */}
      {hasHitos && latestHito && (
        <div className="space-y-3">
          <Callout
            variant="purple"
            title={latestHito.titulo || "Hito de Reduflación Registrado"}
            icon={RiScales3Line}
            meta={formatTimestampToART(latestHito.timestamp_utc)}
            badge={
              <Badge variant="purple" size="xs" className="uppercase">
                Alerta de Packaging
              </Badge>
            }
          >
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">{latestHito.descripcion}</p>
              <p className="font-medium text-purple-800">{latestHito.impacto}</p>

              {olderHitos.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllHitos((prev) => !prev)}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-purple-700 underline decoration-purple-300 underline-offset-2 hover:text-purple-900"
                  >
                    <span>
                      {showAllHitos
                        ? "Ocultar historial anterior"
                        : `Ver ${olderHitos.length} cambios de gramaje anteriores`}
                    </span>
                    {showAllHitos ? (
                      <RiArrowUpSLine className="size-4" />
                    ) : (
                      <RiArrowDownSLine className="size-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </Callout>

          {/* Historial anterior colapsable si existen múltiples hitos en el tiempo */}
          {showAllHitos &&
            olderHitos.map((hito) => (
              <Callout
                key={hito.id}
                variant="neutral"
                title={hito.titulo}
                icon={RiScales3Line}
                meta={formatTimestampToART(hito.timestamp_utc)}
                className="border-purple-200/60 bg-purple-50/30"
              >
                <div className="space-y-0.5 text-xs">
                  <p className="font-medium text-slate-800">{hito.descripcion}</p>
                  <p className="text-purple-700">{hito.impacto}</p>
                </div>
              </Callout>
            ))}
        </div>
      )}

      {/* Ficha Técnica Canónica */}
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RiFileTextLine className="size-4 text-blue-600" aria-hidden="true" />
              <CardTitle className="text-sm font-bold text-slate-900">
                Ficha Técnica del Producto Canónico
              </CardTitle>
            </div>
            <p className="font-mono text-xs font-medium text-slate-400">{product.slug}</p>
          </div>

          <div>
            {externalStoreUrl && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 gap-1.5 rounded-lg border border-blue-200/90 bg-blue-50/70 px-3 text-xs font-semibold text-blue-600 shadow-2xs hover:border-blue-300 hover:bg-blue-100/70 hover:text-blue-700"
              >
                <a href={externalStoreUrl} target="_blank" rel="noopener noreferrer">
                  <span>Auditar Publicación Original en Tienda</span>
                  <RiExternalLinkLine className="size-3.5 text-blue-600" aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Nombre Canónico
              </span>
              <p className="font-bold text-slate-900">{product.nombre_normalizado}</p>
            </div>

            <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Marca / Fabricante
              </span>
              <p className="font-bold text-slate-900">{product.marca}</p>
            </div>

            <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Categoría Oficial
              </span>
              <p className="font-bold text-slate-900">{product.categoria}</p>
            </div>

            <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Modelo / Línea
              </span>
              <p className="font-bold text-slate-900">{product.modelo ?? "--"}</p>
            </div>

            <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Contenido Neto Base
              </span>
              <p className="font-mono font-bold text-slate-900">
                {product.contenido_neto_valor} {product.contenido_neto_unidad}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Unidad Métrica
              </span>
              <p className="font-mono font-bold text-slate-900">
                {product.contenido_neto_unidad} (Normalizada)
              </p>
            </div>

            <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Configuración Pack
              </span>
              <p className="font-bold text-slate-900">{product.pack}</p>
            </div>

            <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 p-3">
              <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Integridad Packaging
              </span>
              <p className="flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700">
                <RiCheckDoubleLine className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span>Especificación Certificada</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
