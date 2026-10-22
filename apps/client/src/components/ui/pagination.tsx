import * as React from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiMoreFill } from "@remixicon/react";

import { buttonVariants, type ButtonProps } from "@/components/ui/button";
import { cx } from "@/lib/utils";

/**
 * Contenedor de navegación semántica oficial de Shadcn UI para controles de paginación.
 */
export function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="Paginación de resultados"
      data-slot="pagination"
      className={cx("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

/**
 * Lista horizontal (`<ul>`) de ítems de paginación de Shadcn UI.
 */
export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cx("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

/**
 * Elemento individual (`<li>`) dentro de la lista de paginación de Shadcn UI.
 */
export function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" className={cx(className)} {...props} />;
}

/**
 * Propiedades del botón de enlace de paginación de Shadcn UI.
 */
export type PaginationLinkProps = {
  /** Indica si el botón corresponde a la página actualmente activa. */
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"button">;

/**
 * Botón numérico o de acción para cambiar de página compuesto sobre `buttonVariants` de Shadcn UI.
 */
export function PaginationLink({
  className,
  isActive = false,
  size = "sm",
  type = "button",
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type={type}
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cx(
        buttonVariants({
          variant: isActive ? "primary" : "secondary",
          size,
        }),
        "h-9 min-w-9 px-3 tabular-nums",
        isActive && "bg-slate-900 hover:bg-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Botón de Shadcn UI para retroceder a la página anterior.
 */
export function PaginationPrevious({
  className,
  text = "Anterior",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Ir a la página anterior"
      size="sm"
      className={cx("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <RiArrowLeftSLine className="size-4 shrink-0" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

/**
 * Botón de Shadcn UI para avanzar a la página siguiente.
 */
export function PaginationNext({
  className,
  text = "Siguiente",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Ir a la página siguiente"
      size="sm"
      className={cx("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <RiArrowRightSLine className="size-4 shrink-0" />
    </PaginationLink>
  );
}

/**
 * Indicador visual de páginas omitidas (`...`) de Shadcn UI.
 */
export function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      data-slot="pagination-ellipsis"
      className={cx("flex size-9 items-center justify-center text-slate-400", className)}
      {...props}
    >
      <RiMoreFill className="size-4" />
      <span className="sr-only">Más páginas</span>
    </span>
  );
}
