# Constitución — PriceScope Client (apps/client)

Principios innegociables. Toda spec, plan y tarea debe cumplirlos estrictamente (Máximo 15 líneas).

1. **Entorno Confinado**: El alcance de trabajo está estrictamente limitado a `apps/client`. Queda prohibido modificar cualquier archivo fuera de este directorio.
2. **La Spec Manda & Stop-and-Ask Obligatorio**: Queda terminantemente prohibido inferir, suponer o tomar decisiones técnicas o de negocio por cuenta propia. Ante cualquier ambigüedad, vacío en la especificación o disyuntiva relevante, es obligatorio detener la ejecución y consultar al usuario.
3. **Separación de Responsabilidades (SoC)**: UI visual desacoplada de lógica matemática/downsampling (`lib/`), adaptadores HTTP (`services/`) y estado (`hooks/`).
4. **Clean Code & SOLID Pragmático**: Responsabilidad única por módulo/componente (~40-100 líneas), interfaces específicas, cero código anticipatorio (KISS/YAGNI) y cero duplicación (DRY).
5. **Flujo de Datos & Cero Prop Drilling**: Composición (`children`, slots), custom hooks y estado derivado. Prohibidos `setState` síncronos redundantes dentro de `useEffect`.
6. **Rigor Matemático & Downsampling (RN-07 / HU-47)**: $\le 90$ días granularidad diaria; $> 90$ días mediana semanal (`agg_precios_semanales`). Cero divisiones por cero.
7. **Números Financieros & Monedas**: Alineación con `tabular-nums`. Variaciones contra cotización de cierre UTC (ARS, USD Blue, USD Oficial).
8. **Protocolo Skill-First Mandatorio**: Antes de cualquier tarea, revisar skills locales aplicables; si no existen, buscar en la web o registro e instalarlas.
9. **Calidad Cero Tolerancia & TDD**: Tipado estricto sin `any`. Todo cambio debe pasar `npm run check-all` (lint, prettier, cspell, test) con 0 errores y 0 advertencias.
