import { RiShieldCheckLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TraceabilityAuditFooterProps {
  engineVersion?: string;
  cutoffPolicy?: string;
  fallbackTtl?: string;
  missingDataPolicy?: string;
}

/**
 * Tarjeta inferior de metadatos de auditoría algorítmica y compliance B2B.
 * Expone la versión del motor forense, corte cambiario, TTL de contingencia y política de datos faltantes.
 */
export function TraceabilityAuditFooter({
  engineVersion = "PriceScope v1.0 (Algoritmo Canónico)",
  cutoffPolicy = "23:59:59 ART (Cierre Diario)",
  fallbackTtl = "72 Horas",
  missingDataPolicy = "Prohibición de Cero / LOCF",
}: TraceabilityAuditFooterProps) {
  return (
    <Card className="border-slate-800 bg-slate-900 text-slate-200">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <RiShieldCheckLine className="size-4" aria-hidden="true" />
          <CardTitle className="text-xs font-bold tracking-wider text-cyan-400 uppercase">
            Bitácora de Certificación Algorítmica y Compliance B2B
          </CardTitle>
        </div>
        <Badge variant="neutral" size="xs" className="border-slate-700 bg-slate-800 text-cyan-300">
          Auditoría Forense
        </Badge>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-4 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Motor Forense
            </span>
            <p className="font-semibold text-white">{engineVersion}</p>
            <p className="text-[11px] text-slate-400">Certificación de lógica matemática B2B</p>
          </div>

          <div className="space-y-1">
            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Corte y Sincronización
            </span>
            <p className="font-semibold text-white">{cutoffPolicy}</p>
            <p className="text-[11px] text-slate-400">
              Alineación exacta con cierre DolarAPI / BCRA
            </p>
          </div>

          <div className="space-y-1">
            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              TTL de Contingencia
            </span>
            <p className="font-semibold text-white">{fallbackTtl}</p>
            <p className="text-[11px] text-slate-400">
              Flag de aproximación automática ante feriados
            </p>
          </div>

          <div className="space-y-1">
            <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Tratamiento de Faltantes
            </span>
            <p className="font-semibold text-white">{missingDataPolicy}</p>
            <p className="text-[11px] text-slate-400">Taxonomía estricta con gaps visibles</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
