import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cx } from "@/lib/utils";

/**
 * Propiedades del contenedor Card combinando el soporte `asChild` de Tremor con Shadcn UI.
 */
interface CardProps extends React.ComponentProps<"div"> {
  /** Aplica las clases sobre el elemento hijo inmediato mediante Radix Slot. */
  asChild?: boolean;
}

/**
 * Contenedor principal Card de Tremor y Shadcn UI con sombra suave (`shadow-sm`) y bordes redondeados.
 */
function Card({ className, asChild = false, ...props }: CardProps) {
  const Component = asChild ? Slot : "div";

  return (
    <Component
      data-slot="card"
      className={cx(
        "flex flex-col rounded-xl border border-slate-200/90 bg-white text-slate-900 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

/**
 * Cabecera del componente Card para alojar título, descripción y acciones.
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cx("flex flex-col gap-1.5 p-5", className)}
      {...props}
    />
  );
}

/**
 * Título semántico dentro de CardHeader.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cx("leading-none font-semibold tracking-tight text-slate-900", className)}
      {...props}
    />
  );
}

/**
 * Subtítulo o texto descriptivo secundario dentro de CardHeader.
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cx("text-xs text-slate-500", className)}
      {...props}
    />
  );
}

/**
 * Contenedor para acciones o iconos alineados a la derecha en CardHeader.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cx("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

/**
 * Cuerpo principal de contenido del componente Card.
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cx("px-5 pb-5", className)} {...props} />;
}

/**
 * Pie del componente Card para metadatos o acciones secundarias.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cx("flex items-center px-5 pb-5", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
