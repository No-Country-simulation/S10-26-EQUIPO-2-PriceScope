import type { AlertaItem } from "@/types/api";

export type SeverityLevel = "all" | "danger" | "warning" | "info";

export type MilestoneVariant =
  "default" | "warning" | "purple" | "teal" | "neutral" | "success" | "error";

export interface AlertMilestoneItem {
  id: string;
  tag: string;
  date: string;
  title: string;
  description: string;
  impactScope: string;
  affectedSkus: string;
  variant: MilestoneVariant;
}

export type DeltaBadgeVariant = "error" | "warning" | "default";

export interface AlertTableRowView {
  id: string;
  canonicalProductId: string;
  name: string;
  store: string;
  varPrice: string;
  varUsd: string;
  delta: string;
  deltaType: DeltaBadgeVariant;
  rateValue: string;
  rateType: string;
  isApprox: boolean;
  category: string;
  rawAlert?: AlertaItem;
}

export interface AlertFiltersState {
  severity: SeverityLevel;
  category: string;
  store: string;
  page: number;
}
