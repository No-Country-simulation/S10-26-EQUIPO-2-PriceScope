import Link from "next/link";
import { RiArrowLeftLine, RiShieldCheckLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";

export interface TraceabilityHeaderProps {
  productId: string;
  divergenceDelta?: string;
  isDanger?: boolean;
}

/**
 * Cabecera ejecutiva de Trazabilidad que utiliza el componente unificado PageHeader.
 */
export function TraceabilityHeader({
  productId,
  divergenceDelta,
  isDanger = false,
}: TraceabilityHeaderProps) {
  const topContent = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" asChild>
        <Link href="/alerts" className="gap-1.5 text-xs text-slate-700">
          <RiArrowLeftLine className="size-3.5" aria-hidden="true" />
          <span>Volver a Alertas</span>
        </Link>
      </Button>
      <span className="text-slate-300">|</span>
      <Badge variant="neutral" size="default" className="font-mono font-bold text-slate-600">
        SKU: {productId}
      </Badge>
      {divergenceDelta && (
        <Badge variant={isDanger ? "error" : "warning"} size="default" className="font-semibold">
          Divergencia {divergenceDelta}
        </Badge>
      )}
      <Badge variant="success" size="default" className="gap-1 font-semibold">
        <RiShieldCheckLine className="size-3 text-emerald-600" aria-hidden="true" />
        <span>Auditado v1.0</span>
      </Badge>
    </div>
  );

  return (
    <PageHeader
      topContent={topContent}
      title="Ficha de Producto y Trazabilidad Forense"
      description="Certificación inmutable de observaciones diarias y trazabilidad matemática contra divisa benchmark."
    />
  );
}
