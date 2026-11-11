<p align="center">
  <img src="../assets/imagotipo.png" alt="PriceScope Logo" width="360"/>
</p>

# Matriz RACI y Modelo de Gobernanza de Células
**PriceScope - Monitor de Inflacion Real Multimoneda**  
*Plataforma B2B de Analitica Economica e Inteligencia de Mercado*

---

## Metadatos del Documento

| Atributo | Detalle Oficial |
| :--- | :--- |
| **Codigo del Documento** | **`PLN-RACI-V1.0`** |
| **Proyecto** | PriceScope - Monitor de Inflacion Real Multimoneda |
| **Organizacion / Programa** | Simulacion Laboral Abierta - NoCountry |
| **Sector de Negocio** | FinTech / Analitica Economica (B2B Analytics) |
| **Version** | **1.0** (Oficial de Gobernanza Operativa) |
| **Fecha de Emision** | 23 de Octubre de 2026 |
| **Ubicacion en Repositorio** | `docs/02-planeacion/03-Matriz-RACI-Gobernanza.md` |
| **Documentos Vinculantes** | `01-SRS-PriceScope.md`, `02-API-Contracts-OpenAPI.md`, `03-Data-Model-TimescaleDB.md`, `05-Software-Architecture-Pipeline.md`, `06-QA-Test-Matrix.md`, `01-Plan-Operativo-Roadmap.md` |
| **Estado** | Aprobado para Sincronizacion de Celulas |

---

## 1. Definicion del Estandar RACI

Para garantizar la delimitacion de responsabilidades y evitar duplicidad o vacios en la ejecucion, cada tarea y artefacto se rige por la convencion RACI:

* **R - Responsible (Responsable de Ejecucion):** Quien construye, codifica o documenta el artefacto. Existe al menos un rol asignado por tarea.
* **A - Accountable (Aprobador Unico / Responsable Final):** Quien valida tecnicamente, firma el sign-off y responde por el cumplimiento del criterio de aceptacion. Solo existe **un rol 'A'** por tarea.
* **C - Consulted (Consultado):** Especialista funcional o tecnico al que se consulta activamente para diseno de interfaces, contratos o reglas matematicas antes de la implementacion.
* **I - Informed (Informado):** Roles o celulas que reciben notificaciones sobre avances, bloqueos o despliegues sin intervenir en la construccion directa.

---

## 2. Mapa de Roles y Celulas Operativas

| Sigla | Rol Operativo | Celula | Integrante Asignado | Responsabilidad Principal |
| :---: | :--- | :---: | :--- | :--- |
| **TL** | Tech Lead / Product Owner Review | `E-QA` | **Gonzalo Cecchin** | Liderazgo tecnico global, gobernanza de monorepo y aprobacion de hitos. |
| **QA** | QA Analyst Lead | `E-QA` | **Karina Luvianos** | Liderazgo de pruebas, certificacion matematica y ejecucion de matriz QA. |
| **BL** | Backend & Database Lead | `E-API` | **Luis Feliz** | Arquitectura de persistencia TimescaleDB, DDL y diseno de contratos API. |
| **BD** | Backend Developer | `E-API` | **Yenny Castro** | Implementacion de servicios REST NestJS, DTOs y logica financiera. |
| **SL** | Scraper Lead | `E-Scrapper` | **Alejandro Hernandez OReilly** | Arquitectura del pipeline .NET 10, Hangfire y mitigacion anti-bot. |
| **SD** | Scraper Developers | `E-Scrapper` | **Anthony Ciprian / Sebastian Torres** | Selectores Playwright, DTOs de extraccion y persistencia de tiendas. |
| **FL** | Frontend Lead & UX/UI Designer | `E-F/UX/UI` | **Juan Camilo Garcia** | Arquitectura cliente Next.js 16, diseno UI, Recharts y accesibilidad WCAG. |

---

## 3. Matriz Consolidada RACI por Dominio de Ingenieria

### 3.1 Dominio de Datos y Persistencia Compartida (`apps/database/`)

| Artefacto / Actividad Clave | TL | QA | BL | BD | SL | SD | FL |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| DDL Oficial e Idempotente (`init.sql`) | C | C | **A** | R | C | I | I |
| Diseno de Hypertables y Politicas de Retencion | C | I | **A** | R | C | I | I |
| Vistas Continuas (`agg_precios_semanales` - RN-07) | C | C | **A** | R | I | I | C |
| Compatibilidad Neon Cloud Serverless PG16 | C | I | **A** | R | I | I | I |
| Validacion de Integridad Anti-Cero en DB (RN-04) | C | **A** | R | R | C | I | I |

### 3.2 Dominio de Extraccion y Scraping (`apps/scraper/`)

| Artefacto / Actividad Clave | TL | QA | BL | BD | SL | SD | FL |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Setup de Worker .NET 10 y Storage Hangfire Postgres | C | I | C | I | **A** | R | I |
| Scrapers de Tiendas Piloto (Carrefour, Jumbo, Fravega, Musimundo) | I | C | C | I | **A** | R | I |
| Protocolo Anti-Bloqueo y Circuit Breaker (R-01) | C | I | I | I | **A** | R | I |
| Bulk Insert Seguro hacia `observaciones_precios` | C | C | C | I | **A** | R | I |
| Telemetria de Corridas en `scraping_worker.scrape_runs` | I | C | C | I | **A** | R | I |

### 3.3 Dominio de Backend REST y Logica Financiera (`apps/api/`)

| Artefacto / Actividad Clave | TL | QA | BL | BD | SL | SD | FL |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Contratos OpenAPI 3.0 y DTOs (`02-API-Contracts-OpenAPI.md`) | **A** | C | R | R | C | I | C |
| Ingesta Cambiaria y Sincronizacion 23:59:59 ART (RN-01) | C | C | **A** | R | I | I | I |
| Fallback Cambiario 72h y Corte `SIN_DATO` (RN-03) | C | C | **A** | R | I | I | C |
| Endpoint `/api/v1/dashboard` con Calculo de Mediana (RN-02) | C | C | **A** | R | I | I | C |
| Endpoint `/api/v1/alerts` con Paginacion a 50 (RN-06 / RFC 7807) | C | C | **A** | R | I | I | C |
| Endpoint `/api/v1/products/{id}/traceability` Forense | C | C | **A** | R | I | I | C |
| Rechazo de Rango > 365 Dias con HTTP 422 (RN-09) | I | C | **A** | R | I | I | C |

### 3.4 Dominio de Frontend y Experiencia de Usuario (`apps/client/`)

| Artefacto / Actividad Clave | TL | QA | BL | BD | SL | SD | FL |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Setup Next.js 16 + React 19 + Tailwind v4 (`constitution.md`) | C | I | I | I | I | I | **A/R** |
| Especificacion y Feature 002: Alineacion de Graficas Recharts | C | C | I | I | I | I | **A/R** |
| Especificacion y Feature 003: Modulo de Alertas e Integracion | C | C | I | C | I | I | **A/R** |
| Especificacion y Feature 004: Ficha de Trazabilidad Forense | C | C | C | I | I | I | **A/R** |
| Modo Mock Transparente Local-First (`src/mocks/`) | I | C | I | I | I | I | **A/R** |
| Rendimiento Fluido a 60 FPS y Downsampling Visual | C | C | I | I | I | I | **A/R** |
| Accesibilidad WCAG 2.1 AA y Navegacion por Teclado | C | C | I | I | I | I | **A/R** |

### 3.5 Dominio de Calidad, Certificacion y QA (`docs/03-qa/`)

| Artefacto / Actividad Clave | TL | QA | BL | BD | SL | SD | FL |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Diseno de Matriz de Pruebas (18 TCs) | **A** | R | C | C | C | I | C |
| Pruebas Unitarias Matematicas (`TC-MATH-01..03`) | C | **A/R** | C | C | I | I | I |
| Pruebas de Resiliencia Temporal (`TC-RESIL-01..04`) | C | **A/R** | C | C | I | I | C |
| Pruebas de Rendimiento y Contratos (`TC-PERF-01..04`) | C | **A/R** | C | C | I | I | C |
| Sign-Off Gate de Pase a Produccion (Fin de Sprint 3) | **A** | R | C | I | C | I | C |

### 3.6 Dominio de DevOps, CI/CD y Despliegues

| Artefacto / Actividad Clave | TL | QA | BL | BD | SL | SD | FL |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Docker Compose Local (`docker-compose.yml`) | C | I | **A** | R | C | I | C |
| Workflows de GitHub Actions (Client, API, Scraper) | **A** | C | C | I | C | I | C |
| Despliegue de Base de Datos en Neon Cloud | **A** | I | R | C | I | I | I |
| Despliegue de Frontend en Vercel | **A** | C | I | I | I | I | R |
| Despliegue de API y Worker en Render / Fly.io | **A** | C | R | C | R | I | I |

---

## 4. Reglas de Gobernanza y Resolucion de Conflictos

1. **Jerarquia de Decision Técnica:** Ante desacuerdos entre contratos de API o estructuras de datos, la precedencia es:
   * **Nivel 1:** Especificacion canonica (`01-SRS` y `02-API-Contracts`).
   * **Nivel 2:** Consenso entre Leads tecnicos (`BL`, `FL`, `SL`).
   * **Nivel 3:** Arbitraje definitivo e inapelable del Tech Lead (`TL`).
2. **Politica de Modificacion de Contratos:** Ninguna celula puede alterar schemas de base de datos o endpoints sin levantar un PR con la etiqueta `contract-change`, requiriendo aprobacion obligatoria de `BL` y `FL`.
3. **Pase a Produccion:** Solo el rol `TL` en conjunto con el informe favorable de `QA` puede autorizar la publicacion a la nube.
