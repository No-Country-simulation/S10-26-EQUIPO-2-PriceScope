# PriceScope — Frontend Web (Client)

Aplicación web analítica B2B de **PriceScope**, diseñada para directores de finanzas (CFOs) y analistas macroeconómicos para el seguimiento de la inflación real multimoneda (ARS, USD Blue y USD Oficial).

> **Nota de Monorepo:** Este archivo contiene exclusivamente la guía técnica y operativa de la aplicación frontend (`apps/client`). Para una visión global del negocio, arquitectura de base de datos TimescaleDB y pipeline de scrapers, consulta el [README principal](../../README.md).

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router con Turbopack)
- **Librería UI:** React 19 + TypeScript 5
- **Estilos & Diseño:** Tailwind CSS v4 + Radix UI Primitives
- **Gráficos & Visualización:** Recharts 3.10 + Tremor Raw
- **Iconografía:** Remix Icon (`@remixicon/react`)
- **Testing:** Vitest + Playwright

---

## 📁 Estructura del Código (`src/`)

```text
src/
├── app/                  # Rutas de Next.js (Dashboard `/`, Alertas `/alerts`, Trazabilidad `/products/[id]/traceability`)
├── components/           # Subcomponentes visuales modulares (~40–90 líneas)
│   ├── alerts/           # Vistas y tablas del módulo de alertas
│   ├── charts/           # Gráficas Recharts adaptadas y trackers de calidad
│   ├── dashboard/        # KPIs, filtros y tablas del tablero principal
│   ├── layout/           # Sidebar colapsable, Header y navegación móvil
│   ├── traceability/     # Ficha técnica y tabla forense de observaciones
│   └── ui/               # Primitivos base de diseño accesibles
├── hooks/                # Custom hooks (estado, datos y control de concurrencia)
├── lib/                  # Lógica matemática, downsampling, formateadores y exportación
├── mocks/                # Datos simulados para desarrollo desacoplado
├── services/             # Adaptadores HTTP desacoplados de la UI
└── types/                # Contratos e interfaces estrictas de TypeScript
```

---

## ⚙️ Configuración y Variables de Entorno

Crea un archivo `.env.local` en la raíz de `apps/client/` tomando como base `.env.example`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- **Modo Mock Automático:** Si `NEXT_PUBLIC_API_URL` no está definida o está vacía, el cliente conmuta de forma transparente a los mocks locales (`src/mocks/`), permitiendo desarrollar, probar y desplegar sin dependencia activa del backend.

---

## 🚀 Comandos Operativos

Todos los comandos deben ejecutarse dentro del directorio `apps/client/`:

```bash
# Servidor de desarrollo local (Turbopack)
npm run dev

# Compilación optimizada para producción
npm run build

# Iniciar servidor de producción local
npm run start

# Suite de pruebas unitarias (Vitest)
npm run test

# Verificación de linter (ESLint)
npm run lint

# Verificación de formateo (Prettier)
npm run format:check

# Verificación de ortografía (CSpell)
npm run spellcheck

# Verificación completa de calidad (0 errores tolerados)
npm run check-all
```

---

## 📐 Convenciones y Estándares

1. **Separación de Responsabilidades:** Prohibido realizar llamadas `fetch` o cálculos matemáticos complejos directamente dentro de componentes visuales; delegar siempre en `services/` y `lib/`.
2. **Cero Prop Drilling:** Uso de composición de componentes (`children`), estado derivado y custom hooks.
3. **Ergonomía y Rendimiento:**
   - Cifras financieras alineadas mediante `tabular-nums`.
   - Downsampling automático en series temporales mayores a 90 días para garantizar renderizado fluido a 60 FPS.
   - Prevención de Cumulative Layout Shift (CLS < 0.1) mediante esqueletos visuales (Skeletons) idénticos al contenido real.
4. **Calidad Estricta:** El código debe superar `npm run check-all` con 0 errores y 0 advertencias antes de emitir cualquier Pull Request.
