import type { DateRange } from "react-day-picker";
import { RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { ExportButton } from "@/components/ui/ExportButton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getPriceScopePresets } from "@/lib/dateRangeUtils";
import type { Moneda } from "@/types/api";

export interface StoreOption {
  id: string;
  name: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}

interface DashboardFiltersCardProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedStore: string;
  onStoreChange: (store: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedCurrency: Moneda;
  onCurrencyChange: (currency: Moneda) => void;
  onResetFilters: () => void;
  onExportCsv?: () => void;
  isExportDisabled?: boolean;
  stores?: StoreOption[];
  categories?: CategoryOption[];
}

/**
 * Barra de filtros dinámicos del Dashboard con alineación compacta a la izquierda (gap-2)
 * y botón unificado de exportación posicionado a la derecha.
 */
export function DashboardFiltersCard({
  dateRange,
  onDateRangeChange,
  selectedStore,
  onStoreChange,
  selectedCategory,
  onCategoryChange,
  selectedCurrency,
  onCurrencyChange,
  onResetFilters,
  onExportCsv,
  isExportDisabled = false,
  stores = [],
  categories = [],
}: DashboardFiltersCardProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Controles de filtro con gap-2 compacto sin anchos excesivos */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-full sm:w-auto">
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="date-range-filter">Rango Temporal de Análisis</Label>
            </div>
            <DateRangePicker
              id="date-range-filter"
              value={dateRange}
              onChange={onDateRangeChange}
              presets={getPriceScopePresets()}
              placeholder="Seleccionar ventana temporal"
              className="w-full min-w-0 sm:w-auto"
            />
          </div>

          <div className="w-full sm:w-auto">
            <Label htmlFor="store-filter" className="mb-1 block">
              Cadena / Tienda
            </Label>
            <Select name="store" value={selectedStore} onValueChange={onStoreChange}>
              <SelectTrigger
                id="store-filter"
                className="w-full min-w-0 sm:w-auto"
                aria-label="Cadena / Tienda"
              >
                <SelectValue placeholder="Seleccionar tienda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {stores.length > 0 ? `Todas las Tiendas (${stores.length})` : "Todas las Tiendas"}
                </SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <Label htmlFor="category-filter" className="mb-1 block">
              Categoría Canónica
            </Label>
            <Select name="category" value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger
                id="category-filter"
                className="w-full min-w-0 sm:w-auto"
                aria-label="Categoría Canónica"
              >
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <Label htmlFor="currency-filter" className="mb-1 block">
              Moneda de Cálculo
            </Label>
            <Select
              name="currency"
              value={selectedCurrency}
              onValueChange={(val) => onCurrencyChange(val as Moneda)}
            >
              <SelectTrigger
                id="currency-filter"
                className="w-full min-w-0 sm:w-auto"
                aria-label="Moneda de Cálculo"
              >
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">ARS ($ Pesos Argentinos)</SelectItem>
                <SelectItem value="USD_BLUE">USD Blue (Cotiz. Cierre)</SelectItem>
                <SelectItem value="USD_OFICIAL">USD Oficial (BNA)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="default"
                  onClick={onResetFilters}
                  className="h-10 w-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:w-auto"
                >
                  <RiRefreshLine className="size-3.5 text-slate-500" />
                  <span>Limpiar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restablecer filtros por defecto</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Botón unificado de exportación alineado a la derecha */}
        {onExportCsv && (
          <div className="shrink-0 self-end">
            <ExportButton
              formatLabel="CSV"
              onExport={onExportCsv}
              disabled={isExportDisabled}
              aria-label="Exportar CSV"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
