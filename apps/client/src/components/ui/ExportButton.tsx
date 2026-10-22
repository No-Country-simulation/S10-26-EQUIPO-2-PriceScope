import React, { useState } from "react";
import { RiCheckLine, RiDownload2Line } from "@remixicon/react";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface ExportButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Callback ejecutado al disparar la descarga */
  onExport?: () => void;
  /** Formato de exportación para la etiqueta por defecto (ej: "CSV" o "JSON") */
  formatLabel: string;
  /** Mensaje de confirmación tras pulsar el botón (por defecto "¡Exportado!") */
  successMessage?: string;
}

/**
 * Botón unificado de exportación de datos (CSV / JSON) con micro-interacción
 * de retroalimentación táctil animada (icono de check y estado de éxito durante 2 segundos).
 * Estandarizado con altura h-10 por defecto en todas las tablas y secciones.
 */
export function ExportButton({
  onExport,
  formatLabel,
  successMessage = "¡Exportado!",
  disabled,
  className = "",
  variant = "secondary",
  size = "default",
  ...props
}: ExportButtonProps) {
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClick = () => {
    if (!onExport) return;
    onExport();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
    }, 2000);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={`h-10 gap-1.5 px-3.5 text-xs shadow-2xs transition-all ${className}`}
      {...props}
    >
      {isSuccess ? (
        <>
          <RiCheckLine
            className="animate-in fade-in size-3.5 text-emerald-600"
            aria-hidden="true"
          />
          <span className="font-semibold text-emerald-700">{successMessage}</span>
        </>
      ) : (
        <>
          <RiDownload2Line className="size-3.5 text-slate-500" aria-hidden="true" />
          <span>Exportar {formatLabel}</span>
        </>
      )}
    </Button>
  );
}
