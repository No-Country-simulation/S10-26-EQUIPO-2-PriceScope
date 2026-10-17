# Plantilla de Pull Request — PriceScope

## 1. Identificación y Alcance
* **Célula Responsable:** `[E-Scrapper / E-API / E-F/UX/UI / E-QA]`
* **Microservicio Afectado:** `[apps/scraper | apps/api | apps/client | docs | infra]`
* **Historias de Usuario / Reglas Relacionadas:** `[Ej. HU-00, HU-30, RN-04, etc.]`

---

## 2. Descripción de los Cambios
<!-- Describe de forma concisa qué problema resuelve este PR o qué funcionalidad incorpora. -->

---

## 3. Estrategia de Prueba y Verificación Local
<!-- Dado que el proyecto opera bajo el paradigma Local-First, describe cómo probaste este cambio en tu entorno local antes de abrir el PR. -->
- [ ] Ejecución exitosa en local sin errores de compilación ni ejecución.
- [ ] Base de datos PostgreSQL / TimescaleDB levantada vía `docker-compose`.
- [ ] Pruebas unitarias o de integración ejecutadas y aprobadas.

---

## 4. Checklist de Calidad Técnica (Definition of Done)
Por favor, marca con una `X` los puntos que apliquen:

- [ ] **Alineación Documental:** El cambio respeta 100% los contratos de `02-API-Contracts-OpenAPI.md`, `03-Data-Model-TimescaleDB.md` y `04-Business-Rules-Math-Logic.md`.
- [ ] **Cumplimiento Anti-Cero (RN-04):** No se envían ni persisten precios en cero (`0.0`) para denotar faltantes (se usa `null` y el estado correspondiente).
- [ ] **Aislamiento de Dependencias:** No se modificaron paquetes ni configuraciones de otros microservicios fuera del asignado.
- [ ] **Linter & Formateo:** El código cumple con las guías de estilo del microservicio sin arrojar advertencias críticas.
- [ ] **Manejo de Secretos:** No se han commiteado credenciales, claves API ni archivos `.env`.

---

## 5. Capturas de Pantalla / Evidencia (Opcional)
<!-- Si aplica para Frontend o reportes de terminal de Scraper/API, adjunta una captura aquí. -->
