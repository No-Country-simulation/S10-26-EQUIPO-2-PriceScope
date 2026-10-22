import * as React from "react";

import { cx } from "@/lib/utils";

/**
 * Contenedor desplazable de tabla oficial de Tremor (`TableRoot`).
 */
function TableRoot({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="table-root">
      <div className={cx("w-full overflow-auto whitespace-nowrap", className)} {...props}>
        {children}
      </div>
    </div>
  );
}

/**
 * Elemento principal `<table>` de Tremor y Shadcn UI con contenedor horizontal adaptable.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        tremor-id="tremor-raw"
        className={cx("w-full caption-bottom border-b border-slate-200 text-sm", className)}
        {...props}
      />
    </div>
  );
}

/**
 * Sección de encabezado `<thead>` de Tremor y Shadcn UI.
 */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cx(
        "border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase [&_tr]:border-b",
        className
      )}
      {...props}
    />
  );
}

/**
 * Cuerpo principal `<tbody>` de la tabla con divisores sutiles entre filas.
 */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cx(
        "divide-y divide-slate-200 border-b border-slate-200 [&_tr:last-child]:border-0",
        className
      )}
      {...props}
    />
  );
}

/**
 * Pie de tabla `<tfoot>` de Tremor (`TableFoot`) y Shadcn UI (`TableFooter`).
 */
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cx(
        "border-t border-slate-200 bg-slate-50/60 text-left font-medium text-slate-900 [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

/**
 * Fila individual `<tr>` con transición de resaltado en hover.
 */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cx(
        "border-b border-slate-100 transition-colors hover:bg-slate-50/90 data-[state=selected]:bg-blue-50/50",
        className
      )}
      {...props}
    />
  );
}

/**
 * Celda de encabezado `<th>` de Tremor (`TableHeaderCell`) y Shadcn UI (`TableHead`).
 */
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cx(
        "border-b border-slate-200 px-4 py-3 text-left align-middle text-[11px] font-semibold tracking-wider whitespace-nowrap text-slate-500 uppercase",
        className
      )}
      {...props}
    />
  );
}

/**
 * Celda de datos `<td>` de Tremor y Shadcn UI con soporte para cifras tabulares.
 */
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cx("px-4 py-3.5 align-middle text-sm whitespace-nowrap text-slate-700", className)}
      {...props}
    />
  );
}

/**
 * Leyenda descriptiva `<caption>` de la tabla.
 */
function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cx("mt-3 px-3 text-center text-xs text-slate-500", className)}
      {...props}
    />
  );
}

const TableHeaderCell = TableHead;
const TableFoot = TableFooter;

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableFooter,
  TableHead,
  TableHeader,
  TableHeaderCell,
  TableRoot,
  TableRow,
};
