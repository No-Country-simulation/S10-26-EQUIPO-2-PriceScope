import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { RiArrowRightSLine, RiMoreFill } from "@remixicon/react";

import { cx } from "@/lib/utils";

/**
 * Contenedor semántico `<nav>` para las migas de pan (Breadcrumb) de Shadcn UI.
 */
function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

/**
 * Lista ordenada `<ol>` que agrupa los elementos del Breadcrumb.
 */
function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cx(
        "flex flex-wrap items-center gap-1.5 text-xs wrap-break-word text-slate-400 sm:gap-2.5",
        className
      )}
      {...props}
    />
  );
}

/**
 * Elemento individual `<li>` dentro de la ruta de navegación del Breadcrumb.
 */
function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cx("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

/**
 * Enlace interactivo dentro del Breadcrumb con soporte personalizable (`asChild` mediante Radix Slot).
 */
function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cx(
        "font-semibold text-slate-400 transition-colors hover:text-slate-700",
        className
      )}
      {...props}
    />
  );
}

/**
 * Nodo final del Breadcrumb que representa la vista o página actual (`aria-current="page"`).
 */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cx("font-bold text-slate-800", className)}
      {...props}
    />
  );
}

/**
 * Separador visual entre niveles del Breadcrumb (acepta un carácter o ícono personalizado).
 */
function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cx("text-slate-300 [&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <RiArrowRightSLine />}
    </li>
  );
}

/**
 * Indicador de niveles intermedios contraídos en el Breadcrumb.
 */
function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cx("flex size-7 items-center justify-center text-slate-400", className)}
      {...props}
    >
      <RiMoreFill className="size-4" />
      <span className="sr-only">Más niveles</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
