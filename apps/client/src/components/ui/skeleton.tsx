import * as React from "react";

import { cx } from "@/lib/utils";

/**
 * Primitivo Skeleton oficial de Shadcn UI para representar estados de carga (RNF-03)
 * y reservar el espacio geométrico evitando desplazamientos de diseño (CLS < 0.1).
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cx("animate-pulse rounded-md bg-slate-200/80", className)}
      {...props}
    />
  );
}

export { Skeleton };
