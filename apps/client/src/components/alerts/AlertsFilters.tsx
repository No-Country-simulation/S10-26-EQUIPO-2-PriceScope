import * as React from "react";
import { RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SeverityLevel } from "@/lib/alerts/types";

const SEVERITY_OPTIONS = [
  { value: "all", label: "Todas las Severidades" },
  { value: "danger", label: "Crítica (> 10.0 pts)" },
  { value: "warning", label: "Moderada (5.0 a 10.0 pts)" },
  { value: "info", label: "Leve (< 5.0 pts)" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "Todas las Categorías" },
  { value: "almacen", label: "Almacén (Canasta Básica)" },
  { value: "lacteos", label: "Lácteos y Frescos" },
  { value: "limpieza", label: "Limpieza y Cuidado" },
  { value: "electro", label: "Electrodomésticos" },
];

const STORE_OPTIONS = [
  { value: "all", label: "Todas las Cadenas" },
  { value: "carrefour", label: "Carrefour" },
  { value: "jumbo", label: "Jumbo Cencosud" },
  { value: "fravega", label: "Frávega" },
  { value: "musimundo", label: "Musimundo" },
  { value: "coto", label: "Coto Digital" },
  { value: "dia", label: "Supermercados DIA" },
];

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

function FilterSelect({ label, value, onChange, options, disabled }: FilterSelectProps) {
  return (
    <div className="w-full sm:w-52 md:w-56">
      <Label className="mb-1 block text-xs font-medium text-slate-700">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={options[0]?.label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export interface AlertsFiltersProps {
  severityFilter: SeverityLevel;
  categoryFilter: string;
  storeFilter: string;
  onSeverityChange: (value: SeverityLevel) => void;
  onCategoryChange: (value: string) => void;
  onStoreChange: (value: string) => void;
  onReset: () => void;
  disabled?: boolean;
}

/**
 * Filter bar component providing dropdowns for severity, category, and store,
 * with identical reset button style and behavior as the dashboard.
 */
export function AlertsFilters({
  severityFilter,
  categoryFilter,
  storeFilter,
  onSeverityChange,
  onCategoryChange,
  onStoreChange,
  onReset,
  disabled = false,
}: AlertsFiltersProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <FilterSelect
            label="Severidad de Divergencia"
            value={severityFilter}
            onChange={(v) => onSeverityChange(v as SeverityLevel)}
            options={SEVERITY_OPTIONS}
            disabled={disabled}
          />
          <FilterSelect
            label="Categoría Canónica"
            value={categoryFilter}
            onChange={onCategoryChange}
            options={CATEGORY_OPTIONS}
            disabled={disabled}
          />
          <FilterSelect
            label="Cadena Minorista"
            value={storeFilter}
            onChange={onStoreChange}
            options={STORE_OPTIONS}
            disabled={disabled}
          />
          <div className="w-full sm:w-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="default"
                  onClick={onReset}
                  disabled={disabled}
                  className="h-10 w-full border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:w-auto"
                >
                  <RiRefreshLine className="size-3.5 text-slate-500" />
                  <span>Limpiar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restablecer filtros por defecto</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  );
}
