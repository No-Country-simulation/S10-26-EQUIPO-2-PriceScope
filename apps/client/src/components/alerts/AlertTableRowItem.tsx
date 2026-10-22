import * as React from "react";
import Link from "next/link";
import { RiAlertLine, RiSearchEyeLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { getRateBadgeInfo } from "@/lib/alerts/severity";
import type { AlertTableRowView } from "@/lib/alerts/types";

export interface AlertTableRowItemProps {
  row: AlertTableRowView;
}

/**
 * Single table row rendering product alert data with tabular numbers and rate badge.
 */
export function AlertTableRowItem({ row }: AlertTableRowItemProps) {
  const rateInfo = getRateBadgeInfo(row.rateType, row.isApprox);
  const rateVariant =
    rateInfo.variant === "approx"
      ? "warning"
      : rateInfo.variant === "oficial"
        ? "sky"
        : rateInfo.variant === "mep"
          ? "indigo"
          : "neutral";

  return (
    <TableRow>
      <TableCell className="px-5 py-3.5">
        <p className="text-xs font-bold text-slate-900">{row.name}</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {row.category} • SKU: {row.id}
        </p>
      </TableCell>
      <TableCell className="px-4 py-3.5 font-semibold text-slate-800">{row.store}</TableCell>
      <TableCell className="px-4 py-3.5 font-bold text-rose-600 tabular-nums">
        {row.varPrice}
      </TableCell>
      <TableCell className="px-4 py-3.5 font-semibold text-slate-700 tabular-nums">
        {row.varUsd}
      </TableCell>
      <TableCell className="px-4 py-3.5">
        <Badge
          variant={row.deltaType}
          size="default"
          className="rounded-full px-3 py-1 font-bold tabular-nums"
        >
          {row.delta}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
            {row.rateValue}
          </span>
          <Badge
            variant={rateVariant}
            size="default"
            title={rateInfo.tooltip}
            className={`px-2.5 py-1 text-xs font-semibold ${row.isApprox ? "cursor-help" : ""}`}
          >
            {row.isApprox && <RiAlertLine className="size-3.5" />}
            <span>{rateInfo.label}</span>
          </Badge>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3.5 text-right">
        <Link
          href={`/products/${row.canonicalProductId}/traceability`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200/80 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          <span>Auditar</span>
          <RiSearchEyeLine className="size-3.5" aria-hidden="true" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
