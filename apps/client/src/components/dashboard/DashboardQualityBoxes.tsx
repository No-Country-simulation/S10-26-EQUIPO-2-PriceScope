import { cx } from "@/lib/utils";

export interface QualityStateConfig {
  id: string;
  label: string;
  description: string;
  boxBorderClass: string;
  boxBgClass: string;
  dotClass: string;
}

export const QUALITY_STATES_4: QualityStateConfig[] = [
  {
    id: "valido",
    label: "Dato Válido",
    description: "Captura íntegra y disponible",
    boxBorderClass: "border-emerald-400/50",
    boxBgClass: "bg-emerald-50/40 hover:bg-emerald-50/70",
    dotClass: "bg-emerald-500",
  },
  {
    id: "agotado",
    label: "Agotado",
    description: "Producto agotado en tienda",
    boxBorderClass: "border-amber-400/50",
    boxBgClass: "bg-amber-50/40 hover:bg-amber-50/70",
    dotClass: "bg-amber-500",
  },
  {
    id: "error_captura",
    label: "Error de Captura",
    description: "Falla de scraper (HTTP 5xx / Timeout)",
    boxBorderClass: "border-rose-400/50",
    boxBgClass: "bg-rose-50/40 hover:bg-rose-50/70",
    dotClass: "bg-rose-500",
  },
  {
    id: "sin_dato",
    label: "Sin Cotización",
    description: "Omisión de captura programada",
    boxBorderClass: "border-slate-300",
    boxBgClass: "bg-slate-50/60 hover:bg-slate-100",
    dotClass: "bg-slate-400",
  },
];

export const QUALITY_STATES_3: QualityStateConfig[] = QUALITY_STATES_4.slice(0, 3);

export interface DashboardQualityBoxesProps {
  mode?: "3-states" | "4-states";
  className?: string;
  states?: QualityStateConfig[];
}

/**
 * Componente modular para representar los estados de calidad de captura
 * de datos en la gráfica (cuadro sin datos internos y texto descriptivo inferior).
 */
export function DashboardQualityBoxes({
  mode = "4-states",
  className,
  states,
}: DashboardQualityBoxesProps) {
  const activeStates = states ?? (mode === "3-states" ? QUALITY_STATES_3 : QUALITY_STATES_4);

  return (
    <div
      className={cx(
        "grid gap-3",
        activeStates.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
        className
      )}
    >
      {activeStates.map((state) => (
        <div key={state.id} className="flex flex-col items-center gap-2 text-center">
          {/* El cuadro (sin datos dentro, solo color/estilo de estado) */}
          <div
            className={cx(
              "flex h-14 w-full items-center justify-center rounded-lg border-2 transition-colors sm:h-16",
              state.boxBorderClass,
              state.boxBgClass
            )}
            aria-hidden="true"
          >
            <span className={cx("size-2.5 rounded-full", state.dotClass)} />
          </div>

          {/* El texto de abajo */}
          <div className="space-y-0.5">
            <span className="block text-xs font-semibold text-slate-800">{state.label}</span>
            <span className="block text-[11px] text-slate-500">{state.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
