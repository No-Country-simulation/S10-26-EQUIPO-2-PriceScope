"use client";

import * as React from "react";
import * as PopoverPrimitives from "@radix-ui/react-popover";

import { cx } from "@/lib/utils";

const Popover = PopoverPrimitives.Root;

const PopoverTrigger = PopoverPrimitives.Trigger;

const PopoverAnchor = PopoverPrimitives.Anchor;

const PopoverClose = PopoverPrimitives.Close;

/**
 * Contenedor flotante Popover de Tremor / Shadcn UI con animaciones de entrada y salida fluidas.
 */
function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  collisionPadding = 8,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitives.Content>) {
  return (
    <PopoverPrimitives.Portal>
      <PopoverPrimitives.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cx(
          "data-[side=bottom]:animate-slide-down-and-fade data-[side=left]:animate-slide-left-and-fade data-[side=right]:animate-slide-right-and-fade data-[side=top]:animate-slide-up-and-fade data-[state=closed]:animate-hide z-50 max-h-(--radix-popover-content-available-height) origin-(--radix-popover-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl outline-none",
          className
        )}
        {...props}
      />
    </PopoverPrimitives.Portal>
  );
}

export { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger };
