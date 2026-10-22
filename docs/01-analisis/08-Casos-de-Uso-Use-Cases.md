<p align="center">
  <img src="../assets/imagotipo.png" alt="PriceScope Logo" width="360"/>
</p>

# Especificación de Casos de Uso (Use Cases)
**PriceScope — Monitor de Inflación Real Multimoneda**
*Plataforma B2B de Analítica Económica e Inteligencia de Mercado*

---

## Metadatos del Documento

| Atributo | Detalle Oficial |
| :--- | :--- |
| **Código del Documento** | `CUS-PRICESCOPE-V1.1` |
| **Proyecto** | PriceScope — Monitor de Inflación Real Multimoneda |
| **Organización / Programa** | Simulación Laboral Abierta — NoCountry |
| **Equipo** | S10-26-EQUIPO-2 |
| **Versión** | 1.1 |
| **Fecha de Emisión** | 20 de Octubre de 2026 |
| **Ubicación** | `docs/01-analisis/08-Casos-de-Uso-Use-Cases.md` |
| **Documentos Vinculantes** | `01-SRS-PriceScope.md`, `02-API-Contracts-OpenAPI.md`, `03-Data-Model-TimescaleDB.md`, `04-Business-Rules-Math-Logic.md`, `05-Software-Architecture-Pipeline.md`, `06-QA-Test-Matrix.md`, `07-Frontend-UX-UI-Specs.md` |
| **Estado** | En Revisión y Aprobación Técnica |

---

## Control de Cambios y Aprobación Formal (Sign-Off)

### HISTORIAL DE VERSIONES
| Versión | Fecha | Autor | Descripción del Cambio |
| :--- | :--- | :--- | :--- |
| **1.0** | 2026-10-19 | Equipo PriceScope | Formalización de los 12 Casos de Uso derivados de las 48 HU, el SRS y las Reglas de Negocio. Incorpora `CU-12` (persistencia/trazabilidad) y consolida las resoluciones H1–H12. |
| **1.1** | 2026-10-20 | Equipo PriceScope | Alineación 100% con `01-SRS` y `03-Data-Model`: conservación de los 4 estados cerrados de `enum_estado_dato` (`HTTP 404 → AGOTADO` con `motivo_faltante = 'HTTP_404_DESPUBLICADO'`), separación de auditoría automática (`HU-41` en `CU-12`) frente a curaduría manual (`CU-09`), marcación explícita de HUs diferidas `(01), (10), (13), (31), (34)` y alineación MoSCoW de `CU-08` y `CU-10` a `Must`. |

### ACTA DE APROBACIÓN TÉCNICA (SIGN-OFF)
La firma de este documento certifica que los flujos, actores, precondiciones y criterios de aceptación constituyen el estándar funcional vinculante para las células de desarrollo y QA.

| Rol | Célula | Integrante | Estado | Firma / Fecha |
| :--- | :--- | :--- | :--- | :--- |
| Tech Lead / PO | — | Gonzalo Cecchín | Pendiente | [ &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026 ] |
| Backend Lead | `E-API` | Luis Feliz | Pendiente | [ &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026 ] |
| Frontend Lead / UX-UI | `E-F/UX/UI` | Juan Camilo García | Aprobado | 20/10/2026 |
| Analista QA | `E-QA` | Karina Luvianos | Pendiente | [ &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026 ] |

---

## 1. Propósito y Alcance

Este documento formaliza los **Casos de Uso (CU)** del sistema PriceScope, derivados de las 48 Historias de Usuario (HU), el SRS y las Reglas de Negocio. Constituye el puente entre el **"qué"** (`01-SRS-PriceScope.md`) y el **"cómo se comporta el sistema paso a paso"** (flujos principales, flujos alternativos, excepciones, actores, precondiciones y criterios de aceptación).

Incluye **12 CU**: 10 en MVP Fase 1, 1 diferido a Fase 1.5/2 (`CU-09` curaduría manual) y 1 transversal de persistencia/trazabilidad (`CU-12`).

## 2. Actores del Sistema

| Actor | Tipo | Descripción | Fase |
| :--- | :--- | :--- | :--- |
| Cliente corporativo | Humano externo | Analista de cadena minorista, fondo o medio. Consulta dashboard, filtros y alertas. | MVP |
| Curador de datos | Humano interno | Aprueba zona gris de matching, gestiona exclusión de outliers y audita correcciones. Requiere Auth/RBAC. | 1.5 / 2 |
| Operador / DevOps | Humano interno (E-Scrapper) | Monitorea pipeline, semáforo de calidad y circuit breaker. | MVP (interno) |
| Scheduler (Hangfire) | Sistema | Dispara captura diaria (03:00–05:00 ART) e ingesta horaria de divisas. | MVP |
| Scraper (E-Scrapper) | Sistema | Extrae publicaciones de los portales piloto. | MVP |
| API / Backend (NestJS) | Sistema | Cálculos, contratos REST y persistencia. | MVP |
| DolarAPI | Sistema externo | Provee cotización oficial y paralela/blue. | MVP |
| Portales de e-commerce | Sistema externo | Carrefour, Jumbo, Frávega, Musimundo. | MVP |

## 3. Convenciones

- **Formato CU:** Actor(es) · Objetivo · Precondiciones · Postcondiciones · Flujo principal · Flujos alternativos · Excepciones · Reglas de negocio · Criterios de aceptación · Datos · Trazabilidad HU · Fase/Prioridad.
- **Prioridad (MoSCoW):** Must / Should / Could / Won't.
- **Fases:** MVP (Fase 1) · Fase 1.5 (Buffer Condicional) · Fase 2 (Post-MVP). Las HU entre paréntesis `(HU-xx)` indican alcance diferido a Fase 1.5 o Fase 2.
- **Terminología:** prohibido el término "inflación real" sin calificar (RN-08).

## 4. Mapa General de Casos de Uso

| CU | Nombre | HU | Fase | MoSCoW | Células |
| :--- | :--- | :--- | :--- | :--- | :--- |
| CU-01 | Ingesta y Captura Diaria de Precios | HU-00, (01), 02…06 | MVP / (1.5) | Must | E-Scrapper, E-API |
| CU-02 | Normalización y Matching Canónico | HU-07, 08, 09, (10), 11 | MVP (1:1) / 1.5 | Must | E-API, E-F/UX/UI |
| CU-03 | Clasificación de Precios, Stock y Reduflación | HU-12, (13), 14…16 | MVP / (2) | Must | E-Scrapper, E-API |
| CU-04 | Ingesta y Validación de Divisas | HU-20, 21, 22 | MVP | Must | E-API |
| CU-05 | Conversión Temporal y Cierre Cambiario | HU-23, 24, 25 | MVP | Must | E-API |
| CU-06 | Cálculo de Variaciones y Mediana por Categoría | HU-26…30, (31) | MVP / (2) | Must | E-API |
| CU-07 | Visualización en Dashboard, Gráficas y Filtros | HU-32, 33, (34), 35, 36 | MVP / (2) | Must | E-F/UX/UI, E-API |
| CU-08 | Detección y Exposición de Alertas e Hitos | HU-37, 38, 39 | MVP | Must | E-API, E-F/UX/UI |
| CU-09 | Curaduría y Auditoría Manual de Datos | (HU-40), 41, (42) | 1.5 / 2 | Could | E-API, E-F/UX/UI |
| CU-10 | Monitoreo Operativo y Calidad del Pipeline | HU-43, 44, 45 | MVP | Must | E-Scrapper, E-API, E-F/UX/UI |
| CU-11 | Optimización, Paginación y Rendimiento UI | HU-46, 47 | MVP | Must | E-API, E-F/UX/UI, E-QA |
| CU-12 | Persistencia Histórica, Estado del Dato y Trazabilidad Forense | HU-17, 18, 19, 41 | MVP | Must | E-API, E-F/UX/UI |

---

## 5. Casos de Uso Detallados

### CU-01 — Ingesta y Captura Diaria de Precios
- **Actores:** Scheduler (Hangfire), Scraper (E-Scrapper), Portales externos; Analista interno (Fase 1.5).
- **Objetivo:** capturar diariamente las publicaciones del seed y persistir observaciones con estado válido dentro de la taxonomía de 4 estados.
- **HU:** HU-00, HU-02…HU-06; **HU-01 diferida a Fase 1.5**. **Fase:** MVP (Must).
- **Precondiciones:** `seed.json` cargado e inicializado de forma idempotente; circuito cerrado; ventana de captura 03:00–05:00 ART.
- **Postcondiciones:** un registro por `(timestamp_utc, producto_canonico_id, tienda_id)` y unicidad de catálogo `(tienda_id, url_origen)`; `estado_dato` asignado; corrida auditada.
- **Flujo principal:**
  1. En la ventana 03:00–05:00 ART el Scheduler dispara la corrida escalonada por tienda (Hangfire `WorkerCount=1`).
  2. Por cada URL activa del `seed.json`, el Scraper navega (Chromium `--no-sandbox --disable-dev-shm-usage`, `NavigationTimeout=30s`, `SelectorTimeout=10s`) con delays de 2–5s.
  3. Extrae nombre, precio regular, tachado, promocional, disponibilidad y categoría.
  4. Clasifica el código HTTP, asigna `estado_dato` y detalla `motivo_faltante` si aplica.
  5. Ejecuta *bulk insert* directo en `observaciones_precios` (TimescaleDB).
  6. Registra el resultado de la corrida en `scrape_runs` y cierra.
- **Flujos alternativos:**
  - A1: HTTP 429 → respeta cabecera `Retry-After` (si $\le 60\text{s}$) antes de reintentar sin penalizar el Circuit Breaker.
  - A2: Reintento Exponential Backoff + Full Jitter ($T_{\text{espera}} = \min(30\text{s}, 2.0\text{s} \times 2^i) + \text{random}(0, 1.5\text{s})$, máx 3 intentos).
  - A3 (Fase 1.5): desacoplamiento de ingesta vía `POST /api/v1/ingest/observations`.
  - A4 (Fase 1.5 — HU-01): alta, edición y desactivación de tiendas vía web (`POST/PUT /api/v1/admin/stores`) conservando histórico y auditando en `auditoria_cambios`.
- **Excepciones:**
  - E1: HTTP 404 → `estado_dato = AGOTADO`, `disponible = false`, `precio_regular = null`, `motivo_faltante = 'HTTP_404_DESPUBLICADO'`, sin reintento (HU-05).
  - E2: HTTP 403 → rotación estocástica de cabeceras/viewport/proxy.
  - E3: 5 fallos 403/429 consecutivos o $>20\%$ error en el lote → `CIRCUIT_BREAKER_OPEN` (suspende solo esa tienda por la jornada) y activa `seed_dataset_offline.json`.
  - E4: timeout/5xx tras 3 reintentos → `estado_dato = ERROR_CAPTURA`, `precio_regular = null`, preserva URL de origen y causa en `motivo_faltante`.
- **Reglas de negocio / Restricciones:** prohibición de valor cero (RN-04); blindaje legal (datos públicos, cero PII); Do-No-Harm 03:00–05:00 ART.
- **Criterios de aceptación:** corrida diaria completa; duplicados bloqueados; CB y Retry-After verificados (`TC-SCRAP-04`, `TC-SCRAP-05`, `TC-RESIL-04`).
- **Datos:** `observaciones_precios`, `seed.json`, `seed_dataset_offline.json`, `auditoria_cambios`.

### CU-02 — Normalización y Matching Canónico
- **Actores:** API/ingesta (MVP); Curador (Fase 1.5).
- **Objetivo:** asociar cada publicación de tienda al producto canónico correspondiente manteniendo trazabilidad e inmutabilidad.
- **HU:** HU-07, HU-08 (1:1 seed en MVP), HU-09, HU-11; **HU-10 diferida a Fase 1.5**. **Fase:** MVP con mapeo 1:1 del seed / matching algorítmico y zona gris en Fase 1.5 (Must).
- **Precondiciones:** `seed.json` con definición de producto canónico (contenido neto normalizado en `kg`, `L`, `unidad` y `pack` separado) y mapeo explícito publicación → canónico.
- **Postcondiciones:** publicación vinculada en `alias_tienda` a un `producto_canonico_id`; vínculo trazable y auditable.
- **Flujo principal (MVP — Semilla 1:1):**
  1. Leer mapeo determinístico desde `seed.json` (`slug` canónico y `tiendas[]`).
  2. Resolver e insertar de forma idempotente el producto en `productos_canonicos` con unidad base (`kg`, `L`, `unidad`) y `pack`.
  3. Persistir el vínculo y nombre comercial en `alias_tienda` (`metodo_matching = 'MANUAL_SEED'`, `score_matching = 1.00`).
  4. Exponer los productos canónicos homologados para series y catálogo.
- **Flujos alternativos (Fase 1.5):**
  - A1 (HU-08 / HU-10): pipeline de similitud $S = w_{\text{marca}}\cdot s_{\text{marca}} + w_{\text{cont}}\cdot s_{\text{cont}} + w_{\text{texto}}\cdot s_{\text{texto}}$; si $S \ge 0.85$ auto-vincula, si $0.41 \le S \le 0.84$ deriva a `GET /api/v1/matching/pending` (`REQUIERE_REVISION`) hasta aprobación en `POST /api/v1/matching/approve`, y si $S \le 0.40$ descarta.
  - A2 (HU-11): reasignación manual de una publicación a otro canónico registrando valor anterior, valor nuevo, usuario, timestamp UTC y motivo en `auditoria_cambios`.
- **Excepciones:** E1: canónico inexistente o diferencia de `pack` sin normalizar → error controlado, se prohíbe inventar vínculo o mezclar `pack x3` con `x1`.
- **Reglas de negocio:** prohibido auto-vincular en zona gris (HU-10 / Anexo B); desacoplamiento de `pack` (RN-05).
- **Criterios de aceptación:** MVP sin falsos positivos (1:1); Fase 1.5 → `TC-MATH-06` (QTM).
- **Datos:** `productos_canonicos`, `alias_tienda`, `auditoria_cambios`.

### CU-03 — Clasificación de Precios, Stock y Reduflación
- **Actores:** Scraper, API.
- **Objetivo:** separar precio regular/promocional, registrar stock sin usar ceros y detectar reduflación automáticamente.
- **HU:** HU-12, HU-14, HU-15, HU-16; **HU-13 diferida a Fase 2**. **Fase:** MVP (Must).
- **Precondiciones:** observación cruda capturada (CU-01).
- **Postcondiciones:** `estado_dato` en taxonomía de 4 estados; `precio_regular` nunca `0`; `precio_por_unidad` calculado; hito generado si hay reduflación.
- **Flujo principal:**
  1. Clasificar precio regular de lista vs. precio tachado vs. precio promocional (`HU-12`); las métricas oficiales consumen exclusivamente `precio_regular`.
  2. Evaluar disponibilidad de compra (`HU-14`).
  3. Comparar el contenido neto con el último registro de `historial_contenido` (`HU-15`).
  4. Calcular el precio por unidad métrica normalizada: `precio_por_unidad = precio_regular / (contenido_neto_valor * factor_pack)` (`HU-16`).
- **Flujos alternativos:**
  - A1 (HU-15): contenido neto reducido ($V_{\text{actual}} < V_{\text{previo}}$) con precio igual o mayor → insertar en `historial_contenido` con motivo `'REDUFLACION'` y generar hito `'AUTOMATICO'` en `hitos_economicos`.
  - A2 (Fase 2 — HU-13): detección heurística de promociones por regex en título/banner (`"2x1"`, `"2da unidad"`).
- **Excepciones:**
  - E1: sin stock o botón de compra deshabilitado → `estado_dato = AGOTADO`, `precio_regular = null`, `precio_promocional = null`, `disponible = false`.
  - E2: intento de insertar precio `0` o `0.00` → constraint `chk_consistencia_dato` aborta la transacción.
- **Reglas de negocio:** RN-04 (anti-cero); RN-05 (reduflación y normalización `$/kg`, `$/L`, `$/unidad`).
- **Criterios de aceptación:** `TC-MATH-03`, `TC-MATH-04`, `TC-MATH-05` (QTM).
- **Datos:** `observaciones_precios`, `historial_contenido`, `hitos_economicos`.

### CU-04 — Ingesta y Validación de Divisas
- **Actores:** Scheduler, API, DolarAPI.
- **Objetivo:** ingerir cotizaciones oficial y paralela/blue con frecuencia horaria y validar sus metadatos de procedencia.
- **HU:** HU-20, HU-21, HU-22. **Fase:** MVP (Must).
- **Precondiciones:** acceso a DolarAPI (o Bluelytics).
- **Postcondiciones:** registro en `cotizaciones_divisas` con moneda base/cotizada, tipo (`oficial`/`parallel`), condición (`venta`/`compra`), fuente y `timestamp_utc`.
- **Flujo principal:**
  1. Cron job horario (`0 * * * *`) consulta la API financiera externa.
  2. Valida esquema, valores mayores a cero (`valor > 0`) y metadatos obligatorios de procedencia.
  3. Persiste las cotizaciones en la hypertable `cotizaciones_divisas`.
- **Excepciones:** E1: API caída o respuesta inválida → registra incidente en logs sin inventar valores numéricos; el fallback de hasta 72h se resuelve en CU-05.
- **Reglas de negocio:** cotización por defecto en consultas = **USD Blue/paralela (`parallel`, condición `venta`, cierre)**; USD Oficial disponible en filtros con aclaración explícita.
- **Criterios de aceptación:** ingesta horaria sin duplicados por clave primaria compuesta; `TC-RESIL-02`.
- **Datos:** `cotizaciones_divisas`.

### CU-05 — Conversión Temporal y Cierre Cambiario
- **Actores:** API.
- **Objetivo:** convertir precios regulares válidos a USD utilizando la cotización de cierre del día local y persistir la tasa aplicada de forma inmutable.
- **HU:** HU-23, HU-24, HU-25. **Fase:** MVP (Must).
- **Precondiciones:** observación con `estado_dato = DATO_VALIDO` y cotizaciones ingeridas en `cotizaciones_divisas`.
- **Postcondiciones:** `precio_usd`, `cotizacion_aplicada` y `cotizacion_aproximada` determinados de forma determinística e inmutable.
- **Flujo principal:**
  1. Convertir `timestamp_utc` de la observación al calendario local (`America/Argentina/Buenos_Aires`, ART = UTC-3) para obtener la fecha local $D$.
  2. Establecer el límite de cierre del día en `23:59:59 ART` y convertirlo a UTC ($L_{\text{cierre\_utc}}$).
  3. Buscar la última cotización `venta` con `timestamp_utc <= L_cierre_utc` y dentro de las últimas 24h (`ORDER BY timestamp_utc DESC LIMIT 1`).
  4. Calcular `precio_usd = precio_regular / cotizacion_aplicada` con `cotizacion_aproximada = false`.
  5. Persistir `cotizacion_aplicada` y `fuente_cotizacion` junto a la observación.
- **Flujos alternativos:**
  - A1 (Fallback 24–72h): si no hay cotización en las últimas 24h pero existe una entre 24h y 72h hacia atrás ($L_{\text{cierre\_utc}} - 72\text{h}$), ejecuta la conversión marcando `cotizacion_aproximada = true` (icono ⚠️ en UI).
- **Excepciones:**
  - E1 (Expiración TTL >72h): si la cotización más reciente supera las 72h de antigüedad → aborta conversión (`precio_usd = null`, `cotizacion_aplicada = null`), asigna `SIN_DATO` a la serie en USD y genera corte físico (*gap*) en la gráfica.
- **Reglas de negocio:** RN-01 (cierre 23:59:59 ART), RN-03 (TTL 72h).
- **Criterios de aceptación:** `TC-RESIL-01`, `TC-RESIL-02`, `TC-RESIL-03`.
- **Datos:** `observaciones_precios.cotizacion_aplicada`, `cotizaciones_divisas`.

### CU-06 — Cálculo de Variaciones y Mediana por Categoría
- **Actores:** API.
- **Objetivo:** calcular variación acumulada en ARS, variación en USD, diferencial en puntos frente a la devaluación y variación agregada por categoría mediante la mediana.
- **HU:** HU-26, HU-27, HU-28, HU-29, HU-30; **HU-31 diferida a Fase 2**. **Fase:** MVP (Must).
- **Precondiciones:** observaciones válidas y conversiones cambiarias disponibles.
- **Postcondiciones:** KPIs calculados con `fecha_inicial`, `fecha_final`, `cantidad_productos` y `cobertura_pct`.
- **Flujo principal:**
  1. Filtrar muestra válida de productos canónicos activos de la categoría con `DATO_VALIDO` y `precio_regular > 0` en ambos extremos del período (aplicando LOCF hasta 5 días hábiles únicamente en los extremos).
  2. Calcular la variación porcentual individual de cada producto: $v_p = ((P_1 - P_0) / P_0) \times 100$.
  3. Ordenar las variaciones de menor a mayor: $v_{(1)} \le v_{(2)} \le \dots \le v_{(N)}$.
  4. Calcular la **Mediana** (valor central $\frac{N+1}{2}$ si $N$ es impar; promedio de $\frac{N}{2}$ y $\frac{N}{2}+1$ si $N$ es par).
  5. Calcular `diferencial_puntos = variacion_precio_pct - variacion_cotizacion_pct` y `cobertura_pct = (N / T_C) * 100`.
- **Flujos alternativos:**
  - A1: `cobertura_pct < 80%` → informa estado `SIN_DATOS_SUFICIENTES` exponiendo igualmente la cobertura real.
  - A2: `N = 0` → `variacion_mediana_pct = null`, `cantidad_productos = 0`, `cobertura_pct = 0.0`, estado `SIN_DATOS_SUFICIENTES`.
  - A3 (Fase 2 — HU-31): marcado preventivo de outliers estadísticos sin borrado destructivo para revisión manual.
- **Excepciones:** E1: rango temporal $>365$ días (366 en año bisiesto) o fechas invertidas/futuras → rechazo inmediato con HTTP `422 Unprocessable Entity` RFC 7807 (RN-09).
- **Reglas de negocio:** RN-02 (mediana obligatoria; prohibido promedio simple); RN-08 (rigor terminológico); RN-09 (límite 365 días); LOCF solo en extremos, nunca para interpolar puntos intermedios.
- **Criterios de aceptación:** `TC-MATH-01`, `TC-MATH-02`, `TC-MATH-07`, `TC-PERF-05`.
- **Datos:** `observaciones_precios`, `agg_precios_semanales`.

### CU-07 — Visualización en Dashboard, Gráficas y Filtros
- **Actores:** Cliente corporativo.
- **Objetivo:** explorar interactivamente KPIs, curvas de evolución en ARS/USD, banda semafórica de calidad y ficha de trazabilidad mediante filtros combinables.
- **HU:** HU-32, HU-33, HU-35, HU-36; **HU-34 diferida a Fase 2**. **Fase:** MVP (Must).
- **Precondiciones:** datos procesados disponibles; **acceso libre sin autenticación** en entorno demo.
- **Postcondiciones:** KPIs, gráfica de evolución y banda de calidad renderizados a 60 FPS con metadatos de trazabilidad.
- **Flujo principal:**
  1. El usuario selecciona filtros combinables (rango `fecha_desde`/`fecha_hasta` o atajos `30D`/`90D`/`1A`, tienda, categoría, moneda).
  2. El Frontend invoca `GET /api/v1/dashboard`.
  3. Renderiza tarjetas KPI, curva de evolución con cortes físicos (*gaps*) ante faltantes y la franja inferior `banda_calidad_diaria` (Verde = `DATO_VALIDO`, Amarillo = `AGOTADO`, Rojo = `ERROR_CAPTURA` / `SIN_DATO`).
  4. Al inspeccionar un punto o indicador, el tooltip muestra cotización aplicada, motivo del hueco y permite abrir el modal de trazabilidad (`CU-12` / `HU-35`).
- **Flujos alternativos:**
  - A1: consulta $>90$ días → consume serie con downsampling semanal (`intervalo_agrupacion: "1w"`, máx ~52 puntos anuales).
  - A2: toggle visual del usuario entre modo estricto (cortes físicos) y modo puenteado (línea punteada).
  - A3 (Fase 2 — HU-34): toggle para superponer la capa de puntos de `precio_promocional` sobre la curva regular.
- **Excepciones:** E1: sin datos en el filtro seleccionado → estado vacío explícito (jamás gráfico en cero).
- **Reglas de negocio:** RN-04 (gaps y semáforo), RN-06 (paginación), RN-07 (downsampling), RN-08 (sin "inflación real" sin calificar), RN-09 (selector restringido a 365 días).
- **Criterios de aceptación:** `TC-PERF-03`, `TC-PERF-04`, `TC-RESIL-04`; render a 60 FPS (<16.6ms/frame).
- **Datos:** payload `/api/v1/dashboard`, `banda_calidad_diaria`.

### CU-08 — Detección y Exposición de Alertas e Hitos
- **Actores:** API, Cliente corporativo.
- **Objetivo:** alertar cuando el aumento porcentual del precio regular supera a la devaluación de la divisa y visualizar hitos contextuales en la gráfica.
- **HU:** HU-37, HU-38, HU-39. **Fase:** MVP — Semana 3 (Must).
- **Precondiciones:** variaciones de `CU-06` calculadas sobre `precio_regular`.
- **Postcondiciones:** alertas expuestas de forma paginada con explicación contextual; hitos visibles como pines verticales.
- **Flujo principal:**
  1. Calcular $\Delta_{\text{puntos}} = v_{\text{precio}} - v_{\text{divisa}}$ en el período evaluado.
  2. Si $\Delta_{\text{puntos}} > 0$, emitir alerta de tipo `INFLACION_DIVERGENTE` detallando ambas tasas, cotización usada y cobertura.
  3. Exponer `GET /api/v1/alerts?page=1&limit=50` con enlace directo a la ficha de trazabilidad del producto (`HU-39`).
  4. Dibujar los hitos manuales (`CyberWeek`) y automáticos (`REDUFLACION`) como marcadores verticales en la gráfica sin alterar la serie (`HU-38`).
- **Excepciones:** E1: `limit > 50` → rechazo con HTTP `422` RFC 7807 (`TC-PERF-02`).
- **Reglas de negocio:** RN-06 (paginación obligatoria $\le 50$), RN-08 (descripción calificada sin ambigüedad).
- **Criterios de aceptación:** `TC-MATH-05`, `TC-MATH-07`, `TC-PERF-01`, `TC-PERF-02`.
- **Datos:** `hitos_economicos`, payload `/api/v1/alerts`.

### CU-09 — Curaduría y Auditoría Manual de Datos *(diferido Fase 1.5 / Fase 2)*
- **Actores:** Curador de datos (Analista interno).
- **Objetivo:** aprobar o rechazar la exclusión de outliers estadísticos en el motor de cálculo, versionar parámetros de reglas de negocio y auditar cambios manuales.
- **HU:** (HU-40), HU-41 (consulta y registro de curaduría manual), (HU-42). **Fase:** 1.5 / 2 (Could) — requiere Auth/RBAC.
- **Precondiciones:** autenticación y rol de curador habilitados; outliers marcados preventivamente (`HU-31`).
- **Postcondiciones:** decisión de exclusión o nueva versión de regla aplicada hacia adelante y registrada en `auditoria_cambios`.
- **Flujo principal:**
  1. El curador revisa la bandeja de observaciones marcadas como atípicas con valor observado, valor esperado y desvío (`HU-40`).
  2. Aprueba o rechaza la exclusión del punto para el motor de cálculo (conservando intacta la fila original en `observaciones_precios`) exigiendo motivo técnico.
  3. Opcionalmente ajusta parámetros de reglas de negocio (cotización default, umbrales) generando una nueva versión etiquetada con timestamp de entrada en vigor sin alterar cálculos históricos (`HU-42`).
  4. El sistema inserta el registro inmutable en `auditoria_cambios` (`usuario_responsable`, `valor_anterior`, `valor_nuevo`, `motivo`, `timestamp_utc`) (`HU-41`).
- **Excepciones:** E1: usuario sin permiso → HTTP `403 Forbidden`.
- **Reglas de negocio:** bitácora estrictamente *append-only* y recálculos solo hacia adelante.
- **Criterios de aceptación:** trazabilidad completa de exclusiones y versionado sin borrado físico.
- **Datos:** `auditoria_cambios`.

### CU-10 — Monitoreo Operativo y Calidad del Pipeline
- **Actores:** Operador / DevOps (Analista interno).
- **Objetivo:** monitorear el estado de la última corrida por tienda, cobertura por dominio, estado del Circuit Breaker y frescura de datos (<24h).
- **HU:** HU-43, HU-44, HU-45. **Fase:** MVP — Semana 3 (Must).
- **Precondiciones:** corridas diarias registradas por el Scraper.
- **Postcondiciones:** telemetría operativa expuesta en `/api/v1/pipeline/status` y banner de frescura en el Dashboard.
- **Flujo principal:**
  1. Consolidar por cada tienda piloto la fecha de última corrida, estado, registros extraídos, agotados y errores de captura (`HU-43`, `HU-44`).
  2. Exponer el estado del Circuit Breaker (`circuit_breaker_open`), activación de fallback offline y enlaces a las URLs con `ERROR_CAPTURA` vía `GET /api/v1/pipeline/status`.
  3. Evaluar la antigüedad de `frescura_datos_utc` respecto a la hora actual (`HU-45`).
- **Excepciones:** E1: última corrida exitosa $>24$ horas atrás → activar `"alerta_atraso_24h": true` y desplegar banner de advertencia visual en el Dashboard.
- **Reglas de negocio:** discriminación estricta entre `AGOTADO` (amarillo) y `ERROR_CAPTURA` / `SIN_DATO` (rojo).
- **Criterios de aceptación:** `TC-RESIL-04`, `TC-SCRAP-05`.
- **Datos:** `scrape_runs`, `observaciones_precios`, payload `/api/v1/pipeline/status`.

### CU-11 — Optimización, Paginación y Rendimiento UI
- **Actores:** API, Frontend, QA.
- **Objetivo:** proteger la memoria de base de datos y navegador garantizando respuestas acotadas y renderizado fluido a 60 FPS.
- **HU:** HU-46, HU-47. **Fase:** MVP (Must).
- **Precondiciones:** consultas sobre listados masivos o series temporales.
- **Postcondiciones:** payloads paginados ($\le 50$ ítems), series largas agrupadas semanalmente ($\le 52$ puntos/año) y renderizado en $<16.6\text{ms}$ por frame.
- **Flujo principal:**
  1. Validar y aplicar paginación `?page=1&limit=50` en todo listado devolviendo metadatos (`pagina_actual`, `limite_por_pagina`, `total_registros`, `total_paginas`) (`HU-46`).
  2. Si el rango consultado en `/dashboard` supera los 90 días, consultar la vista materializada continua `agg_precios_semanales` devolviendo la mediana semanal con `"downsampling_aplicado": true` e `"intervalo_agrupacion": "1w"` (`HU-47`).
  3. Si el rango es $\le 90$ días, devolver la serie diaria con `"downsampling_aplicado": false`.
- **Excepciones:**
  - E1: `limit > 50` → rechazo inmediato con HTTP `422` RFC 7807 (`TC-PERF-02`).
  - E2: rango $>365$ días → rechazo inmediato con HTTP `422` RFC 7807 sin ejecutar consulta en BD (`TC-PERF-05`).
- **Reglas de negocio:** RN-06, RN-07, RN-09.
- **Criterios de aceptación:** `TC-PERF-01` a `TC-PERF-05`.
- **Datos:** `agg_precios_semanales`.

### CU-12 — Persistencia Histórica, Estado del Dato y Trazabilidad Forense
- **Actores:** API (`E-API`), Scraper (`E-Scrapper`); Cliente corporativo y Analista interno (consulta).
- **Objetivo:** garantizar el almacenamiento *append-only* en TimescaleDB, la clasificación en los 4 estados oficiales, la bitácora inmutable de cambios y la reconstrucción forense de cualquier indicador.
- **HU:** HU-17, HU-18, HU-19, HU-41 (bitácora automática en MVP). **Fase:** MVP (Must).
- **Precondiciones:** hypertables `observaciones_precios` y `cotizaciones_divisas` y tabla `auditoria_cambios` operativas en PostgreSQL + TimescaleDB.
- **Postcondiciones:** historial inmutable disponible; todo indicador o punto del gráfico es reconstruible con sus fuentes y cotización de cierre.
- **Flujo principal:**
  1. Persistir observaciones de forma estrictamente incremental (*append-only*) en `observaciones_precios`, prohibiendo cualquier `UPDATE` destructivo de montos históricos (`HU-17`).
  2. Tipificar obligatoriamente cada registro bajo `enum_estado_dato` $\in$ {`DATO_VALIDO`, `AGOTADO`, `ERROR_CAPTURA`, `SIN_DATO`} y registrar la causa específica en `motivo_faltante` (`HU-18`).
  3. Registrar en `auditoria_cambios` las operaciones críticas de inicialización, homologación o contingencia con timestamp UTC (`HU-41`).
  4. Exponer `GET /api/v1/products/{id}/traceability` (protegido con UUID v4 contra IDOR) entregando fechas base, URL de origen directa, historial cronológico, `cotizacion_aplicada`, fuente cambiaria y `cobertura_pct` (`HU-19`, `HU-35`).
  5. Explicitar en la respuesta la regla de faltantes aplicada (`LOCF`) y la bandera `cotizacion_aproximada` (`HU-19`).
- **Excepciones:**
  - E1: intento de sobrescritura histórica o inserción de precio `0` → bloqueado en BD por política *append-only* y constraint `chk_consistencia_dato` (`TC-MATH-03`).
  - E2: `id` inexistente o formato no UUID → HTTP `404` / `400` bajo estándar RFC 7807 (`TC-SEC-01`).
- **Reglas de negocio:** append-only + correcciones solo hacia adelante; prohibición del 0 falso (RN-04); UUID inmutable en rutas (anti-IDOR).
- **Criterios de aceptación:** 3 días de precios generan 3 tuplas independientes ordenadas; cualquier indicador abre su ficha de trazabilidad completa; `TC-MATH-03`, `TC-SEC-01`.
- **Datos:** `observaciones_precios`, `historial_contenido`, `auditoria_cambios`.

---

## 6. Matriz de Trazabilidad HU ↔ CU ↔ RN ↔ TC

| HU | CU | RN | TC (QTM / BRM) | Fase |
| :--- | :--- | :--- | :--- | :--- |
| HU-00, 02…06 | CU-01 | RN-04, unicidad, legal, CB | TC-SCRAP-04/05, TC-RESIL-04 | MVP |
| (HU-01) | (CU-01 A4) | auditoría de tiendas | — | 1.5 |
| HU-07, 08, 09, 11 | CU-02 | RN-05 (matching 1:1 en MVP) | — | MVP / 1.5 |
| (HU-10) | (CU-02 A1) | zona gris (Anexo B) | TC-MATH-06 (QTM) | 1.5 |
| HU-12, 14, 15, 16 | CU-03 | RN-04, RN-05 | TC-MATH-03/04/05 (QTM) | MVP |
| (HU-13) | (CU-03 A2) | heurística regex promos | — | 2 |
| HU-17, 18, 19, 41 | CU-12 | RN-04, append-only, trazabilidad | TC-MATH-03, TC-SEC-01 | MVP |
| HU-20, 21, 22 | CU-04 | RN-03, default paralela | TC-RESIL-02 | MVP |
| HU-23, 24, 25 | CU-05 | RN-01, RN-03 | TC-RESIL-01/02/03 | MVP |
| HU-26…30 | CU-06 | RN-02, RN-08, RN-09 | TC-MATH-01/02/07, TC-PERF-05 | MVP |
| (HU-31) | (CU-06 A3) | marcado preventivo outliers | — | 2 |
| HU-32, 33, 35, 36 | CU-07 | RN-04, RN-06/07/08/09 | TC-PERF-03/04, TC-RESIL-04 | MVP |
| (HU-34) | (CU-07 A3) | capa visual promociones | — | 2 |
| HU-37, 38, 39 | CU-08 | RN-06, RN-08 | TC-MATH-05/07, TC-PERF-01/02 | MVP |
| (HU-40), 41, (42) | CU-09 | curaduría manual y versionado | — | 1.5 / 2 |
| HU-43, 44, 45 | CU-10 | calidad y frescura <24h | TC-RESIL-04, TC-SCRAP-05 | MVP |
| HU-46, 47 | CU-11 | RN-06, RN-07, RN-09 | TC-PERF-01…05 | MVP |

---

## 7. Supuestos de Contexto

1. Los productos del `seed.json` tienen URL estable y mapeo 1:1 confiable para las 4 tiendas piloto.
2. DolarAPI mantiene disponibilidad razonable; caídas o feriados $<72\text{h}$ se cubren automáticamente con el fallback de RN-03.
3. "Cierre del día" = `23:59:59 ART` (`UTC-3` sin horario de verano). *(Confirmado)*
4. El dashboard demo no requiere autenticación ni arquitectura multi-tenant en el MVP.
5. "Producto representativo" = categoría relevante + URL estable + disponibilidad recurrente + presentación comparable entre competidores.

---

## 8. Modificaciones y Actualizaciones Planteadas

### 8.1 Resoluciones aplicadas

| ID | Tipo | Hallazgo | Resolución | Archivo afectado |
| :--- | :--- | :--- | :--- | :--- |
| H1 | `[INCONSISTENCIA]` | Colisión de IDs `TC-MATH-xx` entre `04-BRM` y `06-QTM` | Renumerar §11 de BRM a `TC-BRM-01…11` (`06-QTM` = marco oficial de QA) | `04-Business-Rules-Math-Logic.md` |
| H2 | `[INCONSISTENCIA]` | `TC-SCRAP-04/05` en la matriz QA | Incluidos en `06-QTM` (§3.1, §5 y Sign-Off Gate §6) | `06-QA-Test-Matrix.md` |
| H3 | `[INCONSISTENCIA]` | SRS Anexo C listaba HUs diferidas sin marca | Marcar entre paréntesis `(HU-01)`, `(HU-10)`, `(HU-13)`, `(HU-31)`, `(HU-34)`, `(HU-40, 42)` | `01-SRS-PriceScope.md` |
| H4 | `[INCONSISTENCIA]` | `HU-17/18/19` (Must Have) sin CU asignado | Crear **`CU-12`** transversal (incluyendo bitácora `HU-41`) + fila en Anexo C del SRS | `01-SRS-PriceScope.md`, este documento |
| H5 | `[AMBIGÜEDAD]` | Propagación de `cotizacion_aproximada` a KPIs | Exponer flag agregado a nivel serie/KPI sin alterar el cálculo de la mediana | `04-Business-Rules-Math-Logic.md` |
| H6 | `[FALTA DEFINICIÓN]` | Criterio de "producto representativo" | Documentado en §7 de este documento | este documento |
| H7 | `[AMBIGÜEDAD]` | Curaduría manual sin Auth en MVP | `CU-09` (exclusión manual de outliers `HU-40` y reglas `HU-42`) → Fase 1.5/2; bitácora automática `HU-41` activa en MVP vía `CU-12` | este documento |
| H8 | `[ALINEACIÓN DB]` | Tratamiento de `HTTP 404` sin romper `enum_estado_dato` | Se mantienen los 4 estados cerrados (`DATO_VALIDO`, `AGOTADO`, `ERROR_CAPTURA`, `SIN_DATO`). `HTTP 404 → estado_dato = AGOTADO` (sin reintento) y detalle `'HTTP_404_DESPUBLICADO'` en `motivo_faltante` | `01-SRS-PriceScope.md`, este documento |
| H9 | `[ALCANCE MVP]` | Matching difuso y zona gris en MVP | En MVP opera mapeo determinístico 1:1 desde `seed.json`; scoring y zona gris (`HU-10`) en Fase 1.5 | `01-SRS-PriceScope.md`, este documento |
| H10 | `[SUPUESTO VALIDADO]` | "Cierre del día" = 23:59:59 ART | Confirmado por el PO y reflejado en `01-SRS` §10 | `01-SRS-PriceScope.md` |
| H11 | `[MEJORA]` | `POST /ingest/observations` en Fase 1.5 | Modelado como flujo alternativo `A3` de `CU-01` (Fase 1.5) | este documento |
| H12 | `[MEJORA]` | Acceso libre sin login en demo | Precondición transversal de `CU-07` | este documento |

### 8.2 Decisiones de producto consolidadas

1. Cotización default = **USD Blue/paralela** (`parallel`, condición `venta`, cierre); USD Oficial disponible en filtros con explicación obligatoria.
2. Matching MVP = **seed determinístico 1:1**; bandas de similitud = Anexo B activas en Fase 1.5.
3. `HU-10` (Zona Gris) y `HU-01` (ABM Tiendas) **diferidas** a Fase 1.5 (Buffer Condicional).
4. `HU-06`: prevención de duplicados por constraint en BD = Must Have (Fase 1); endpoint `POST /ingest/observations` = Fase 1.5.
5. Umbral de cobertura muestral mínimo = **80%** (`SIN_DATOS_SUFICIENTES` por debajo de `80%`).
6. Reproceso **solo hacia adelante** (*append-only* + registro en `auditoria_cambios`).
7. Timestamps en **UTC ISO 8601** + corte cambiario a las **23:59:59 ART (UTC-3)**.

### 8.3 Bloqueantes y estado

| Bloqueante | Estado tras este documento |
| :--- | :--- |
| H1 (colisión IDs `TC-BRM` vs `TC-MATH`) | **Resuelto** (actualizado en `04-BRM`) |
| H2 (matriz QA `TC-SCRAP-04/05`) | **Resuelto** (incluido en `06-QTM`) |
| H4 (HU-17/18/19 sin CU) | **Resuelto** (`CU-12` creado e integrado en `01-SRS`) |

---

## 9. Control de Aprobación

| Rol | Célula | Integrante | Estado |
| :--- | :--- | :--- | :--- |
| Tech Lead / PO | — | Gonzalo Cecchín | Pendiente |
| Backend Lead | `E-API` | Luis Feliz | Pendiente |
| Frontend Lead / UX-UI | `E-F/UX/UI` | Juan Camilo García | Aprobado |
| Analista QA | `E-QA` | Karina Luvianos | Pendiente |
