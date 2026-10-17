<p align="center">
  <img src="../assets/imagotipo.png" alt="PriceScope Logo" width="360"/>
</p>

# Especificación de Contratos de API (OpenAPI 3.0 / DTOs)
**PriceScope — Monitor de Inflación Real Multimoneda**  
*Plataforma B2B de Analítica Económica e Inteligencia de Mercado*

---

## Metadatos del Documento

| Atributo | Detalle Oficial |
| :--- | :--- |
| **Código del Documento** | `API-PRICESCOPE-V1.0` |
| **Proyecto** | PriceScope — Monitor de Inflación Real Multimoneda |
| **Organización / Programa** | Simulación Laboral Abierta — NoCountry |
| **Sector de Negocio** | FinTech / Analítica Económica (B2B Analytics) |
| **Versión** | 1.1 (Oficial para Revisión y Aprobación Técnica) |
| **Fecha de Emisión** | 16 de Octubre de 2026 |
| **Ubicación en Repositorio** | `docs/01-analisis/02-API-Contracts-OpenAPI.md` |
| **Documentos Vinculantes** | `01-SRS-PriceScope.md`, `03-Data-Model-TimescaleDB.md`, `04-Business-Rules-Math-Logic.md` |
| **Estado** | En Revisión y Aprobación Técnica por Células Operativas |

---

## Control de Cambios y Acta de Aprobación Técnica (Sign-Off)

### HISTORIAL DE VERSIONES
| Versión | Fecha | Autor | Descripción del Cambio |
| :--- | :--- | :--- | :--- |
| **0.1** | 2026-10-15 | Juan Camilo García | Propuesta inicial de payloads JSON para maquetación Frontend. |
| **1.0** | 2026-10-16 | Juan Camilo García | Formalización OpenAPI 3.0: esquemas tipados, endpoints de dashboard con soporte de presets y rango de fechas libre (`fecha_desde`, `fecha_hasta`), alertas paginadas (HU-46), trazabilidad, DTO de ingesta para inserción masiva en Fase 1 / endpoint en Fase 1.5, soporte de panel condicional y contratos RFC 7807. |
| **1.1** | 2026-10-16 | Equipo PriceScope | Alineación total 100% con 01-SRS: integración formal de especificación OpenAPI para `GET /api/v1/alerts` (4.2) y `GET /api/v1/products/{id}/traceability` (4.3), interfaces TypeScript completas (`TraceabilityResponse`, `PipelineStatusResponse`), homologación de campos DTO (`estado_captura` / `estado_dato`) y blindaje de la regla operativa de prioridad (Fase 1 bulk insert directo vs. Fase 1.5 endpoint HTTP). |

### ACTA DE REVISIÓN Y APROBACIÓN TÉCNICA (SIGN-OFF)
La firma de este apartado formaliza los esquemas JSON y endpoints como contrato vinculante para el ciclo de desarrollo de 4 semanas. Ninguna célula modificará nombres de llaves ni tipos sin consenso previo:

| Rol Operativo | Célula de Trabajo | Integrante Asignado | Estado de Revisión | Firma / Fecha |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Lead & UX/UI** | `E-F/UX/UI` | Juan Camilo García | Aprobado | 16/10/2026 |
| **Backend Lead (`E-API`)** | `E-API` | Luis Feliz | Pendiente | [ &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026 ] |
| **Scraping Lead (`E-Scrapper`)** | `E-Scrapper` | Alejandro Hernández OReilly | Pendiente | [ &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026 ] |
| **Tech Lead / PO Review** | `E-QA` | Gonzalo Cecchín | Pendiente | [ &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026 ] |

---

## 1. Estrategia de Implementación Técnica y Phasing de Alcance

Con el propósito de mitigar riesgos de integración y permitir el avance simultáneo de los 8 integrantes sin bloqueos entre células:

```text
[FASE 1: MVP CRÍTICO — SEMANAS 1 A 4]
 ├── Ingesta Determinística:
 │    └── E-Scrapper lee URLs directas desde `seed.json` (HU-00).
 │    └── Persistencia directa en base de datos vía INSERT masivo (bulk insert) en TimescaleDB.
 ├── Motor API y Lectura:
 │    └── E-API implementa endpoints GET (/dashboard, /alerts, /products/{id}/traceability).
 │    └── Ingesta cambiaria horaria (DolarAPI) y sincronización al Cierre del Día (23:59:59 local).
 └── Visualización Frontend:
      └── E-F/UX/UI maqueta con mocks basados en este contrato e integra consumo real en Semana 2.

[FASE 1.5: BUFFER CONDICIONAL — SEMANAS 3 A 4]
 ├── Condición de Activación: Cumplimiento y estabilización previa de la Fase 1.
 ├── Desacoplamiento de Ingesta HTTP:
 │    └── Habilitación del endpoint `POST /api/v1/ingest/observations` para recibir extracciones vía red.
 └── Curaduría y Configuración Web:
      └── Activación del Panel de Administración de Tiendas (`POST/PUT /admin/stores`, HU-01).
      └── Activación de la Cola de Revisión de Zona Gris (`GET/POST /matching/*`, HU-10).
```

## 2. Convenciones Globales y Estándares de Comunicación

* **Base URL:** `/api/v1`
* **Codificación y Formato:** `application/json; charset=utf-8` para todas las peticiones y respuestas.
* **Convención de Llaves:** `snake_case` estricto en parámetros de consulta, propiedades JSON y atributos de error.
* **Estándar Temporal (RN-01, HU-04):** Toda estampa temporal se procesa y transfiere obligatoriamente en formato UTC bajo norma ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`). El cliente web es el único responsable de la conversión visual al huso horario del usuario.
* **Prohibición del Valor Cero ante Faltantes (RN-04):** Queda estrictamente prohibido retornar precios en cero (`0` o `0.0`) para indicar faltantes de captura, errores de red o quiebres de inventario. Se debe responder con `null` en el campo del precio y clasificar la causa en `estado_dato` (`DATO_VALIDO`, `AGOTADO`, `ERROR_CAPTURA`, `SIN_DATO`).
* **Tratamiento de Errores:** Adopción del estándar **RFC 7807 (Problem Details for HTTP APIs)** para todas las respuestas con códigos de error 4xx y 5xx.

---

## 3. Matriz General de Endpoints del Sistema

| Método | Endpoint | Épica / Requerimientos | Célula Proveedora | Célula Receptora | Alcance Operativo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard` | E7 / E8 (HU-26 a HU-30, HU-32, HU-33, HU-47) | `E-API` | `E-F/UX/UI` | **Fase 1 (MVP Esencial)** |
| `GET` | `/api/v1/alerts` | E9 / E12 (HU-37, HU-39, HU-46) | `E-API` | `E-F/UX/UI` | **Fase 1 (MVP Esencial)** |
| `GET` | `/api/v1/products/{id}/traceability` | E4 / E8 (HU-16, HU-19, HU-35) | `E-API` | `E-F/UX/UI` | **Fase 1 (MVP Esencial)** |
| `POST` | `/api/v1/ingest/observations` | E1 (HU-03 a HU-06, DTO Ingesta) | `E-API` | `E-Scrapper` | *Fase 1 (DTO) / Fase 1.5 (Endpoint)* |
| `GET` | `/api/v1/pipeline/status` | E11 (HU-43, HU-44, HU-45) | `E-API` | `E-F/UX/UI` | **Fase 1 (Semana 3)** |
| `GET` | `/api/v1/matching/pending` | E2 (HU-08, HU-10) | `E-API` | `E-F/UX/UI` | *Fase 1.5 (Buffer Condicional)* |
| `POST` | `/api/v1/matching/approve` | E2 (HU-10, HU-11) | `E-API` | `E-F/UX/UI` | *Fase 1.5 (Buffer Condicional)* |
| `POST` | `/api/v1/admin/stores` | E1 (HU-01) | `E-API` | `E-F/UX/UI` | *Fase 1.5 (Buffer Condicional)* |

---

## 4. Especificación Detallada de Endpoints (Fase 1 — MVP Esencial)

---

### 4.1 Tablero Principal: `GET /api/v1/dashboard`
* **Descripción Funcional:** Alimenta la vista analítica central del monitor económico. Soporta presets rápidos de tiempo (`1m`, `3m`, `1y`) y selección de rango personalizado (`fecha_desde` y `fecha_hasta`). Entrega KPIs de variación acumulada, comparativa por categorías calculada mediante la **Mediana** (RN-02, HU-30), gráfico de evolución temporal con soporte de **Downsampling algorítmico** (RN-07, HU-47) y la franja semafórica diaria de calidad de datos (RN-04).

#### Parámetros de Consulta (Query Parameters)
| Parámetro | Tipo de Dato | Obligatorio | Valor por Defecto | Valores Permitidos | Descripción Técnica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fecha_desde` | `string` | No | `Hace 30 días` | Formato `YYYY-MM-DD` | Fecha inicial del rango de análisis. Si se omite, toma por defecto 30 días atrás. |
| `fecha_hasta` | `string` | No | `Fecha actual` | Formato `YYYY-MM-DD` | Fecha final del rango de análisis. Si se omite, toma la fecha actual. |
| `moneda` | `string` | No | `ARS` | `ARS`, `USD` | Moneda base de conversión para métricas y series. |
| `tienda_id` | `string` | No | `null` | `carrefour`, `jumbo`, `fravega`, `musimundo` | Filtro por comercio piloto; omisión indica consolidado general. |
| `categoria_id` | `string` | No | `null` | `canasta-basica`, `bienes-durables` | Filtro por sector económico. |

#### Lógica de Resolución Temporal y Downsampling en Backend
1. **Rango de Fechas Limpio y Límite Máximo (RN-09):** La API opera determinísticamente con el par `(fecha_desde, fecha_hasta)`.
   * **Tope Máximo de 365 Días:** Si $(\text{fecha\_hasta} - \text{fecha\_desde}) > 366 \text{ días}$, la API rechaza la petición con código **`422 Unprocessable Entity`** bajo estándar RFC 7807.
   * **Prohibición de Fechas Futuras:** La `fecha_hasta` no puede ser posterior a la fecha actual del sistema.
2. **Disparo de Downsampling Automático (RN-07 / HU-47):**
   * **Rango $\le 90$ días:** El backend entrega la serie diaria continua con `"downsampling_aplicado": false` e `"intervalo_agrupacion": "1d"`.
   * **Rango $> 90$ días (y $\le 365$ días):** El backend agrupa automáticamente las observaciones por semana usando la **mediana semanal** (`agg_precios_semanales`), devolviendo un máximo de 52 puntos consolidados por año con `"downsampling_aplicado": true` e `"intervalo_agrupacion": "1w"`.

#### Códigos de Respuesta HTTP
* `200 OK`: Consulta ejecutada exitosamente.
* `400 Bad Request`: Formato de fecha inválido o `fecha_desde` posterior a `fecha_hasta`.
* `422 Unprocessable Entity`: Rango temporal solicitado superior a 365 días (RN-09) o fecha futura detectada.
* `500 Internal Server Error`: Fallo de ejecución en agregaciones de base de datos.

#### Payload de Respuesta (200 OK)
```json
{
  "contexto": {
    "frescura_datos_utc": "2026-10-16T14:00:00Z",
    "filtros_activos": {
      "moneda": "ARS",
      "fecha_desde": "2026-05-01",
      "fecha_hasta": "2026-10-16",
      "tienda_id": null,
      "categoria_id": null
    }
  },
  "kpis": {
    "variacion_pesos": {
      "porcentaje": 20.0,
      "fecha_inicial": "2026-05-01T00:00:00Z",
      "fecha_final": "2026-10-16T00:00:00Z",
      "cobertura_pct": 98.5,
      "estado": "SUFICIENTE",
      "regla_faltantes": "LOCF"
    },
    "variacion_usd": {
      "porcentaje": 0.0,
      "cotizacion_usada": 1200.0,
      "fuente_cotizacion": "DolarAPI_Cierre",
      "tipo_cotizacion": "BLUE"
    },
    "comparacion_devaluacion": {
      "diferencial_puntos": 5.0,
      "variacion_precio_pct": 25.0,
      "variacion_cotizacion_pct": 20.0
    }
  },
  "variacion_por_categoria": [
    {
      "categoria_id": "canasta-basica",
      "nombre": "Canasta Básica",
      "variacion_mediana_pct": 5.0,
      "cantidad_productos": 42,
      "cobertura_pct": 95.0
    },
    {
      "categoria_id": "bienes-durables",
      "nombre": "Bienes Durables",
      "variacion_mediana_pct": 3.2,
      "cantidad_productos": 28,
      "cobertura_pct": 91.0
    }
  ],
  "grafico_evolucion": {
    "metadata": {
      "downsampling_aplicado": true,
      "intervalo_agrupacion": "1w"
    },
    "hitos": [
      {
        "timestamp_utc": "2026-10-01T00:00:00Z",
        "tipo": "AUTOMATICO",
        "titulo": "Reduflación Detectada",
        "descripcion": "Café molido Marca A redujo empaque de 500g a 450g al mismo precio"
      }
    ],
    "banda_calidad_diaria": [
      { "fecha": "2026-10-14", "estado": "VERDE" },
      { "fecha": "2026-10-15", "estado": "AMARILLO" },
      { "fecha": "2026-10-16", "estado": "ROJO" }
    ],
    "series": [
      {
        "timestamp_utc": "2026-10-14T00:00:00Z",
        "precio_regular": 12000.0,
        "precio_promocional": null,
        "precio_usd": 10.0,
        "estado_dato": "DATO_VALIDO",
        "cotizacion_aplicada": 1200.0,
        "cotizacion_aproximada": false,
        "motivo": null
      },
      {
        "timestamp_utc": "2026-10-15T00:00:00Z",
        "precio_regular": null,
        "precio_promocional": null,
        "precio_usd": null,
        "estado_dato": "AGOTADO",
        "cotizacion_aplicada": null,
        "cotizacion_aproximada": false,
        "motivo": "Sin stock en tienda"
      },
      {
        "timestamp_utc": "2026-10-16T00:00:00Z",
        "precio_regular": 12500.0,
        "precio_promocional": null,
        "precio_usd": 10.42,
        "estado_dato": "DATO_VALIDO",
        "cotizacion_aplicada": 1200.0,
        "cotizacion_aproximada": true,
        "motivo": "Fallback cambiario 24h aplicado"
      }
    ]
  }
}
```

---

### 4.2 Detección de Alertas Inflacionarias: `GET /api/v1/alerts`
* **Descripción Funcional:** Alimenta la tabla interactiva de alertas económicas (HU-37, HU-39). Identifica aquellos productos canónicos cuya variación porcentual de precio nominal supera al avance de la cotización cambiaria (`variacion_precio_pct > variacion_cotizacion_pct`) en el rango evaluado.
* **Paginación Obligatoria (RN-06 / HU-46):** Exige parámetros `page` y `limit` para proteger el rendimiento del navegador frente a catálogos masivos. El servidor rechaza cualquier petición con `limit > 50` con error RFC 7807 (422 Unprocessable Entity).

#### Parámetros de Consulta (Query Parameters)
| Parámetro | Tipo de Dato | Obligatorio | Valor por Defecto | Valores Permitidos | Descripción Técnica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | No | `1` | $\ge 1$ | Número de página consultada. |
| `limit` | `integer` | No | `50` | $1 \le \text{limit} \le 50$ | Cantidad máxima de registros por página (Tope estricto de 50). |
| `fecha_desde` | `string` | No | `Hace 30 días` | Formato `YYYY-MM-DD` | Fecha inicial del rango de evaluación de alertas. |
| `fecha_hasta` | `string` | No | `Fecha actual` | Formato `YYYY-MM-DD` | Fecha final del rango de evaluación de alertas. |
| `tienda_id` | `string` | No | `null` | `carrefour`, `jumbo`, `fravega`, `musimundo` | Filtro opcional por comercio emisor. |
| `categoria_id` | `string` | No | `null` | `canasta-basica`, `bienes-durables` | Filtro opcional por categoría. |

#### Códigos de Respuesta HTTP
* `200 OK`: Consulta ejecutada exitosamente; listado paginado de alertas devuelto.
* `400 Bad Request`: Formato de fecha inválido o `fecha_desde` posterior a `fecha_hasta`.
* `422 Unprocessable Entity`: Parámetro `limit` superior a 50 (RN-06).
* `500 Internal Server Error`: Fallo de base de datos al computar diferenciales cambiarios.

#### Payload de Respuesta (200 OK)
```json
{
  "paginacion": {
    "pagina_actual": 1,
    "limite_por_pagina": 50,
    "total_registros": 1,
    "total_paginas": 1
  },
  "alertas": [
    {
      "alerta_id": "alt-20261016-001",
      "producto_canonico_id": "b3e21a88-7f2c-4b55-89df-1c0a2f4d6e90",
      "producto_nombre": "Café tostado molido clásico",
      "tienda_nombre": "Carrefour",
      "periodo": {
        "inicio_utc": "2026-09-15T00:00:00Z",
        "fin_utc": "2026-10-15T00:00:00Z"
      },
      "variacion_precio_pct": 25.0,
      "variacion_cotizacion_pct": 20.0,
      "diferencial_puntos": 5.0,
      "cotizacion_usada_cierre": 1200.0,
      "cobertura_pct": 100.0,
      "regla_faltantes": "LOCF",
      "tipo_alerta": "PRECIO_SUPERA_DEVALUACION"
    }
  ]
}
```

---

### 4.3 Ficha de Trazabilidad por Producto: `GET /api/v1/products/{id}/traceability`
* **Descripción Funcional:** Entrega la auditoría forense completa de un producto canónico específico (HU-16, HU-19, HU-35), permitiendo al cliente corporativo y analista interno verificar tiendas de origen, URLs directas de publicación, precios por unidad normalizados ($/kg, $/L) y cotizaciones de cierre aplicadas en cada captura.

#### Parámetros de Ruta (Path Parameters)
| Parámetro | Tipo de Dato | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `string (UUID)` | Sí | Identificador inmutable del producto canónico (mitigación IDOR). |

#### Parámetros de Consulta (Query Parameters)
| Parámetro | Tipo de Dato | Obligatorio | Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `tienda_id` | `string` | No | `null` | Filtrar trazabilidad a una tienda en particular. |
| `fecha_desde` | `string` | No | `null` | Fecha inicial de filtrado (`YYYY-MM-DD`). |
| `fecha_hasta` | `string` | No | `null` | Fecha final de filtrado (`YYYY-MM-DD`). |

#### Códigos de Respuesta HTTP
* `200 OK`: Historial de trazabilidad devuelto exitosamente.
* `400 Bad Request`: Formato de UUID o fecha inválido.
* `404 Not Found`: El producto canónico solicitado no existe en el catálogo maestro.
* `500 Internal Server Error`: Error al consultar la serie histórica en TimescaleDB.

#### Payload de Respuesta (200 OK)
```json
{
  "producto": {
    "id": "b3e21a88-7f2c-4b55-89df-1c0a2f4d6e90",
    "slug": "prod-cafe-marcaA-500g",
    "nombre_normalizado": "Café tostado molido clásico",
    "marca": "Marca A",
    "modelo": null,
    "categoria": "Canasta Básica",
    "contenido_neto_valor": 0.5,
    "contenido_neto_unidad": "kg",
    "pack": "x1"
  },
  "historico_observaciones": [
    {
      "timestamp_utc": "2026-10-16T14:00:00Z",
      "tienda_id": "carrefour",
      "tienda_nombre": "Carrefour",
      "url_origen": "https://www.carrefour.com.ar/cafe-molido-marca-a-500g",
      "sku_tienda": "CAR-12345",
      "alias_producto": "Café molido Marca A 500g",
      "precio_regular": 12000.0,
      "precio_promocional": null,
      "precio_por_unidad": 24000.0,
      "unidad_medida": "kg",
      "precio_usd": 10.0,
      "estado_dato": "DATO_VALIDO",
      "cotizacion_aplicada": 1200.0,
      "cotizacion_aproximada": false,
      "fuente_cotizacion": "DolarAPI_Cierre",
      "motivo_faltante": null
    },
    {
      "timestamp_utc": "2026-10-15T14:00:00Z",
      "tienda_id": "jumbo",
      "tienda_nombre": "Jumbo",
      "url_origen": "https://www.jumbo.com.ar/cafe-tostado-molido-marca-a-paq-500-gr",
      "sku_tienda": "JUM-98765",
      "alias_producto": "Café tostado molido Marca A paq 500 gr",
      "precio_regular": null,
      "precio_promocional": null,
      "precio_por_unidad": null,
      "unidad_medida": "kg",
      "precio_usd": null,
      "estado_dato": "AGOTADO",
      "cotizacion_aplicada": null,
      "cotizacion_aproximada": false,
      "fuente_cotizacion": null,
      "motivo_faltante": "Sin stock en góndola digital"
    }
  ]
}
```

---

### 4.4 Monitoreo Operativo del Pipeline: `GET /api/v1/pipeline/status`
* **Descripción Funcional:** Alimenta la cabecera de observabilidad técnica del sistema, exponiendo la frescura temporal de los datos y el estado de recolección de las 4 tiendas piloto (HU-43, HU-45).

#### Parámetros de Consulta (Query Parameters)
* No requiere parámetros obligatorios.

#### Códigos de Respuesta HTTP
* `200 OK`: Consulta ejecutada exitosamente; reporte de estado devuelto.
* `500 Internal Server Error`: Fallo de conexión con los registros de auditoría o base de datos.

#### Payload de Respuesta (200 OK)
```json
{
  "estado_global": "OPERATIVO",
  "frescura_general_utc": "2026-10-16T14:00:00Z",
  "alerta_atraso_24h": false,
  "tiendas": [
    {
      "tienda_id": "carrefour",
      "nombre": "Carrefour",
      "ultima_corrida_utc": "2026-10-16T14:00:00Z",
      "estado_corrida": "EXITOSA",
      "publicaciones_procesadas": 42,
      "publicaciones_fallidas": 0,
      "cobertura_pct": 100.0
    },
    {
      "tienda_id": "jumbo",
      "nombre": "Jumbo",
      "ultima_corrida_utc": "2026-10-16T14:05:00Z",
      "estado_corrida": "EXITOSA",
      "publicaciones_procesadas": 40,
      "publicaciones_fallidas": 2,
      "cobertura_pct": 95.0
    },
    {
      "tienda_id": "fravega",
      "nombre": "Frávega",
      "ultima_corrida_utc": "2026-10-16T14:10:00Z",
      "estado_corrida": "EXITOSA",
      "publicaciones_procesadas": 28,
      "publicaciones_fallidas": 0,
      "cobertura_pct": 100.0
    },
    {
      "tienda_id": "musimundo",
      "nombre": "Musimundo",
      "ultima_corrida_utc": "2026-10-16T14:15:00Z",
      "estado_corrida": "ADVERTENCIA",
      "publicaciones_procesadas": 25,
      "publicaciones_fallidas": 3,
      "cobertura_pct": 89.2
    }
  ]
}
```

## 5. DTO de Ingesta y Transición de Arquitectura Scraper

> **Regla de Prioridad y Operación de Ingesta (Fase 1 vs. Fase 1.5):**  
> * **Fase 1 (MVP Esencial — Prioridad Absoluta):** La célula `E-Scrapper` extrae precios consultando las URLs directas de `seed.json` / `alias_tienda` (HU-00) y mapea este objeto DTO para efectuar **inserciones masivas en lote (`bulk insert`) directamente en PostgreSQL + TimescaleDB**. No se utiliza ningún endpoint HTTP intermediario para evitar bloqueos entre células.  
> * **Fase 1.5 (Buffer Condicional — Semanas 3 a 4):** Únicamente si la Fase 1 está completada y estabilizada, la célula `E-API` activará el endpoint `POST /api/v1/ingest/observations` como refactor para recibir los datos vía HTTP.

### 5.1 Estructura del Objeto DTO / Payload HTTP: `POST /api/v1/ingest/observations`
* **Descripción Funcional:** Contrato de transporte para recibir observaciones extraídas, validar tipos y estados de stock antes de persistir en la hypertable.
* **Compatibilidad de Nombres:** Para mantener alineación 100% con la especificación del SRS (Sección 2), el payload admite indistintamente el campo `"estado_captura"` (definición original del extractor) o `"estado_dato"` (columna destino en base de datos).

#### Cabeceras Requeridas (Headers — Solo Fase 1.5)
| Cabecera | Tipo de Dato | Valor Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `Content-Type` | `string` | `application/json` | Formato estándar de carga útil. |
| `X-Scraper-Batch-Token` | `string` | Token de servicio interno | Token estático de autorización entre microservicios. |

#### Cuerpo de Petición (Request Body)
```json
{
  "tienda_id": "carrefour",
  "lote_timestamp_utc": "2026-10-16T14:00:00Z",
  "total_registros": 2,
  "observaciones": [
    {
      "url_origen": "https://www.carrefour.com.ar/cafe-molido-marca-a-500g",
      "sku_tienda": "CAR-12345",
      "nombre_publicacion": "Café molido Marca A 500g",
      "precio_regular": 12000.0,
      "precio_promocional": null,
      "disponible": true,
      "estado_captura": "DATO_VALIDO",
      "motivo_faltante": null
    },
    {
      "url_origen": "https://www.carrefour.com.ar/aceite-girasol-15l",
      "sku_tienda": "CAR-67890",
      "nombre_publicacion": "Aceite de girasol 1.5L",
      "precio_regular": null,
      "precio_promocional": null,
      "disponible": false,
      "estado_captura": "AGOTADO",
      "motivo_faltante": "Botón de compra deshabilitado en tienda"
    }
  ]
}
```

#### Códigos de Respuesta HTTP
* `201 Created`: Lote validado e insertado exitosamente en base de datos.
* `400 Bad Request`: Inconsistencia en marcas de tiempo o formato JSON malformado.
* `401 Unauthorized`: Token de servicio ausente o inválido.
* `422 Unprocessable Entity`: Violación de reglas de negocio (por ejemplo, precio regular en cero `0.0` o `estado_dato` inválido).

#### Payload de Respuesta (201 Created)
```json
{
  "lote_id": "batch-carrefour-202610161400",
  "estado": "PROCESADO",
  "total_recibidos": 2,
  "total_insertados": 2,
  "total_rechazados": 0,
  "timestamp_utc": "2026-10-16T14:00:05Z"
}
```

---

## 6. Endpoints Condicionales (Fase 1.5 — Buffer Condicional)

Especificación formal para habilitar el Panel de Administración y la Curaduría de Zona Gris si se completa anticipadamente el MVP.

### 6.1 Panel de Administración de Tiendas: `POST /api/v1/admin/stores` (HU-01)
* **Descripción Funcional:** Permite dar de alta y configurar tiendas desde una interfaz web dinámica sin tocar archivos de configuración ni reiniciar servicios.

#### Cabeceras Requeridas (Headers)
| Cabecera | Tipo de Dato | Valor Requerido |
| :--- | :--- | :--- |
| `Content-Type` | `string` | `application/json` |

#### Cuerpo de Petición (Request Body)
```json
{
  "nombre": "Coto Digital",
  "slug": "coto-digital",
  "url_base": "https://www.cotodigital3.com.ar",
  "tipo": "supermercado"
}
```

#### Códigos de Respuesta HTTP
* `201 Created`: Tienda registrada y habilitada en el catálogo.
* `400 Bad Request`: Datos de comercio incompletos o URL base inválida.
* `409 Conflict`: Ya existe una tienda registrada con el mismo nombre comercial.

#### Payload de Respuesta (201 Created)
```json
{
  "id": "b3e21a88-7f2c-4b55-89df-1c0a2f4d6e90",
  "slug": "coto-digital",
  "nombre": "Coto Digital",
  "url_base": "https://www.cotodigital3.com.ar",
  "tipo": "supermercado",
  "activo": true,
  "created_at": "2026-10-16T14:20:00Z"
}
```

---

### 6.2 Cola de Revisión de Zona Gris: `GET /api/v1/matching/pending` (HU-10)
* **Descripción Funcional:** Expone las publicaciones recolectadas que arrojaron un score intermedio (entre 0.41 y 0.84) para que el analista interno audite la asociación sugerida.

#### Parámetros de Consulta (Query Parameters)
| Parámetro | Tipo de Dato | Obligatorio | Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `integer` | No | `1` | Índice de página consultada. |
| `limit` | `integer` | No | `20` | Cantidad de emparejamientos pendientes por página. |

#### Códigos de Respuesta HTTP
* `200 OK`: Lista de propuestas pendientes devuelta exitosamente.

#### Payload de Respuesta (200 OK)
```json
{
  "total_pendientes": 1,
  "propuestas": [
    {
      "propuesta_id": "match-987",
      "publicacion_extraida": {
        "tienda_id": "carrefour",
        "nombre": "Café Molienda Suave Marca A 500 grs",
        "url": "https://www.carrefour.com.ar/cafe-molienda-suave-500",
        "precio_detectado": 12000.0
      },
      "canonico_sugerido": {
        "id": "prod-cafe-marcaA-500g",
        "nombre": "Café molido Marca A",
        "marca": "Marca A",
        "contenido_neto": "0.5 kg"
      },
      "score_confianza": 0.76,
      "motivo_duda": "Discrepancia en descriptor de molienda ('Suave')"
    }
  ]
}
```

---

### 6.3 Aprobación / Rechazo de Matching: `POST /api/v1/matching/approve` (HU-10, HU-11)
* **Descripción Funcional:** Registra la decisión humana sobre un emparejamiento dudoso, actualizando la clave foránea del canónico y creando un registro inmutable en la bitácora de auditoría.

#### Cuerpo de Petición (Request Body)
```json
{
  "propuesta_id": "match-987",
  "decision": "APROBADO",
  "producto_canonico_id": "prod-cafe-marcaA-500g",
  "usuario_firmante": "jgarcia@pricescope.com",
  "motivo": "Homologación aprobada para molienda estándar"
}
```

#### Códigos de Respuesta HTTP
* `200 OK`: Decisión persistida y par confirmado en el catálogo.
* `404 Not Found`: `propuesta_id` o `producto_canonico_id` inexistente.
* `422 Unprocessable Entity`: Decisión no reconocida (solo admite `APROBADO` o `RECHAZADO`).

#### Payload de Respuesta (200 OK)
```json
{
  "propuesta_id": "match-987",
  "estado": "RESUELTO",
  "decision_aplicada": "APROBADO",
  "asociado_a_canonico_id": "prod-cafe-marcaA-500g",
  "auditado_en_utc": "2026-10-16T14:25:00Z"
}
```

---

## 7. Esquema Uniforme de Errores (RFC 7807)

Ante cualquier fallo de validación o del servidor, la API devuelve este formato uniforme:

```json
{
  "type": "https://pricescope.internal/errors/unprocessable-entity",
  "title": "Violación de Parámetro de Paginación",
  "status": 422,
  "detail": "El parámetro 'limit' solicitado (100) excede el máximo permitido de 50 registros por página (HU-46).",
  "instance": "/api/v1/alerts?page=1&limit=100",
  "timestamp_utc": "2026-10-16T14:35:00Z"
}
```

---

## 8. Definición de Tipos TypeScript (`src/types/api.ts`)

Definición de interfaces para tipar los mocks y clientes HTTP en React:

```typescript
export type EstadoDato = 'DATO_VALIDO' | 'AGOTADO' | 'ERROR_CAPTURA' | 'SIN_DATO';
export type EstadoSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO';
export type Moneda = 'ARS' | 'USD';

export interface PaginacionMeta {
  pagina_actual: number;
  limite_por_pagina: number;
  total_registros: number;
  total_paginas: number;
}

export interface KpiVariacion {
  porcentaje: number;
  fecha_inicial: string;
  fecha_final: string;
  cobertura_pct: number;
  estado: 'SUFICIENTE' | 'SIN_DATOS_SUFICIENTES';
  regla_faltantes?: string;
}

export interface VariacionCategoria {
  categoria_id: string;
  nombre: string;
  variacion_mediana_pct: number;
  cantidad_productos: number;
  cobertura_pct: number;
}

export interface PuntoSerie {
  timestamp_utc: string;
  precio_regular: number | null;
  precio_promocional: number | null;
  precio_usd: number | null;
  estado_dato: EstadoDato;
  cotizacion_aplicada: number | null;
  cotizacion_aproximada: boolean;
  motivo?: string | null;
}

export interface HitoGrafico {
  timestamp_utc: string;
  tipo: 'AUTOMATICO' | 'MANUAL';
  titulo: string;
  descripcion: string;
}

export interface BandaCalidad {
  fecha: string;
  estado: EstadoSemaforo;
}

export interface DashboardResponse {
  contexto: {
    frescura_datos_utc: string;
    filtros_activos: {
      moneda: Moneda;
      fecha_desde: string;
      fecha_hasta: string;
      tienda_id: string | null;
      categoria_id: string | null;
    };
  };
  kpis: {
    variacion_pesos: KpiVariacion;
    variacion_usd: {
      porcentaje: number;
      cotizacion_usada: number;
      fuente_cotizacion: string;
      tipo_cotizacion: string;
    };
    comparacion_devaluacion: {
      diferencial_puntos: number;
      variacion_precio_pct: number;
      variacion_cotizacion_pct: number;
    };
  };
  variacion_por_categoria: VariacionCategoria[];
  grafico_evolucion: {
    metadata: {
      downsampling_aplicado: boolean;
      intervalo_agrupacion: '1d' | '1w';
    };
    hitos: HitoGrafico[];
    banda_calidad_diaria: BandaCalidad[];
    series: PuntoSerie[];
  };
}

export interface AlertaItem {
  alerta_id: string;
  producto_canonico_id: string;
  producto_nombre: string;
  tienda_nombre: string;
  periodo: {
    inicio_utc: string;
    fin_utc: string;
  };
  variacion_precio_pct: number;
  variacion_cotizacion_pct: number;
  diferencial_puntos: number;
  cotizacion_usada_cierre: number;
  cobertura_pct: number;
  regla_faltantes: string;
  tipo_alerta: string;
}

export interface AlertsResponse {
  paginacion: PaginacionMeta;
  alertas: AlertaItem[];
}

export interface ProductoCanonicoDetalle {
  id: string;
  slug: string;
  nombre_normalizado: string;
  marca: string;
  modelo: string | null;
  categoria: string;
  contenido_neto_valor: number;
  contenido_neto_unidad: 'kg' | 'L' | 'unidad';
  pack: string;
}

export interface ObservacionTrazabilidadItem {
  timestamp_utc: string;
  tienda_id: string;
  tienda_nombre: string;
  url_origen: string;
  sku_tienda: string | null;
  alias_producto: string;
  precio_regular: number | null;
  precio_promocional: number | null;
  precio_por_unidad: number | null;
  unidad_medida: 'kg' | 'L' | 'unidad';
  precio_usd: number | null;
  estado_dato: EstadoDato;
  cotizacion_aplicada: number | null;
  cotizacion_aproximada: boolean;
  fuente_cotizacion: string | null;
  motivo_faltante?: string | null;
}

export interface TraceabilityResponse {
  producto: ProductoCanonicoDetalle;
  historico_observaciones: ObservacionTrazabilidadItem[];
}

export interface PipelineTiendaStatus {
  tienda_id: string;
  nombre: string;
  ultima_corrida_utc: string;
  estado_corrida: 'EXITOSA' | 'ADVERTENCIA' | 'FALLIDA';
  circuit_breaker_open: boolean;
  fallback_activo: boolean;
  publicaciones_procesadas: number;
  publicaciones_fallidas: number;
  cobertura_pct: number;
}

export interface PipelineStatusResponse {
  estado_global: 'OPERATIVO' | 'DEGRADADO' | 'CRITICO';
  frescura_general_utc: string;
  alerta_atraso_24h: boolean;
  tiendas: PipelineTiendaStatus[];
}
```