import * as React from "react";

import { cx } from "@/lib/utils";

export interface SeparatorProps extends React.ComponentPropsWithoutRef<"div"> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

/**
 * Componente Separator de Shadcn UI para divisores visuales o semánticos
 * horizontales y verticales entre bloques de información.
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <div
      data-slot="separator"
      role={decorative ? "none" : "separator"}
      aria-orientation={!decorative ? orientation : undefined}
      data-orientation={orientation}
      className={cx(
        "shrink-0 bg-slate-200 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-4 data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  );
}

export { Separator };
