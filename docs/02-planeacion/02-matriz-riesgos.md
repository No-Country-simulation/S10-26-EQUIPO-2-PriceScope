<p align="center">
  <img src="../assets/imagotipo.png" alt="PriceScope Logo" width="360"/>
</p>

# Matriz de Riesgos y Protocolos de Contingencia
**PriceScope — Monitor de Inflación Real Multimoneda**  
*Plataforma B2B de Analítica Económica e Inteligencia de Mercado*

---

## Metadatos del Documento

| Atributo | Detalle Oficial |
| :--- | :--- |
| **Código del Documento** | **`RSK-PRICESCOPE-V1.0`** |
| **Proyecto** | PriceScope — Monitor de Inflación Real Multimoneda |
| **Organización / Programa** | Simulación Laboral Abierta — NoCountry |
| **Sector de Negocio** | FinTech / Analítica Económica (B2B Analytics) |
| **Versión** | **1.0** (Oficial de Gestión de Riesgos Técnicos y Operativos) |
| **Fecha de Emisión** | 16 de Octubre de 2026 |
| **Ubicación en Repositorio** | `docs/02-planeacion/02-matriz-riesgos.md` |
| **Documentos Vinculantes** | `01-SRS-PriceScope.md`, `04-Business-Rules-Math-Logic.md`, `05-Software-Architecture-Pipeline.md`, `06-QA-Test-Matrix.md` |
| **Estado** | En Revisión y Aprobación Técnica por Células Operativas |

---

## Control de Cambios y Aprobación Formal (Sign-Off)

### HISTORIAL DE VERSIONES
| Versión | Fecha | Autor | Descripción del Cambio |
| :--- | :--- | :--- | :--- |
| **1.0** | 2026-10-16 | Equipo PriceScope | Formalización de riesgos técnicos, operativos y de infraestructura (bloqueos de scrapers, cuotas cloud gratuitas, caída de APIs cambiarias, desviaciones algorítmicas) y definición de protocolos de contingencia y fallbacks automáticos. |

### ACTA DE APROBACIÓN TÉCNICA (SIGN-OFF)
| Rol Operativo | Célula de Trabajo | Integrante Asignado | Estado de Revisión | Firma / Fecha |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Lead & UX/UI** | `E-F/UX/UI` | Juan Camilo García | Aprobado | 16/10/2026 |
| **Tech Lead / PO Review** | `E-QA` | Gonzalo Cecchín | Pendiente | [ &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026 ] |
| **Backend & DB Lead** | `E-API` | Luis Feliz | Pendiente | [ &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026 ] |
| **Scraper Lead** | `E-Scrapper` | Alejandro Hernández OReilly | Pendiente | [ &nbsp;&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp; / 2026 ] |

---

## 1. Metodología de Clasificación y Evaluación de Riesgos

Para salvaguardar la viabilidad del proyecto, cada riesgo identificado se califica según su **Probabilidad de Ocurrencia** (Baja: 1, Media: 2, Alta: 3) y su **Impacto en el Negocio / Entrega** (Bajo: 1, Moderado: 2, Crítico: 3).

El **Nivel de Severidad** se determina mediante el producto:
$$\text{Severidad} = \text{Probabilidad} \times \text{Impacto}$$

* **Severidad 6 – 9 (Crítica / Bloqueante):** Requiere protocolo de mitigación preventiva activa y arquitectura de fallback automático implementada en código desde el día uno.
* **Severidad 3 – 4 (Media):** Requiere monitoreo preventivo y estrategia de desacoplamiento.
* **Severidad 1 – 2 (Baja):** Se absorbe dentro del plan de desarrollo rutinario.

```mermaid
quadrantChart
    title Matriz de Calor de Riesgos PriceScope
    x-axis Baja Probabilidad --> Alta Probabilidad
    y-axis Bajo Impacto --> Alto Impacto
    quadrant-1 Riesgos Críticos (Acción Inmediata)
    quadrant-2 Riesgos de Alto Impacto (Plan de Contingencia)
    quadrant-3 Riesgos Menores (Monitoreo)
    quadrant-4 Riesgos Operativos Frecuentes (Mitigación Estándar)
    "R-01: Bloqueo Anti-Bot E-Commerce": [0.8, 0.9]
    "R-02: Agotamiento de Cuotas Cloud Gratis": [0.85, 0.75]
    "R-03: Caída Prolongada de API Divisas": [0.6, 0.85]
    "R-04: Degradación UI con Series Largas": [0.5, 0.7]
    "R-05: Inyección de Valor Cero Falso": [0.4, 0.9]
    "R-06: Desalineación entre Células": [0.4, 0.6]
```

---

## 2. Matriz Consolidada de Riesgos Técnicos y Operativos

| ID | Categoría | Descripción del Riesgo | Prob. | Imp. | Sev. | Célula Responsable | Estrategia de Mitigación Preventiva |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **R-01** | Extracción | **Bloqueo Anti-Bot / Cloudflare en Portales E-Commerce:** Las tiendas piloto detectan tráfico automatizado y bloquean IPs mediante Captcha o códigos HTTP 403/429. | 3 | 3 | **9 (Crítica)** | `E-Scrapper` | Uso de Playwright con emulación realista de headers de usuario (`User-Agent`, delays aleatorios de 2 a 5s entre peticiones, retries exponenciales de Hangfire). En caso extremo de bloqueo total, fallback al archivo de contingencia `seed_dataset_offline.json`. |
| **R-02** | Infraestructura | **Agotamiento de Cuotas Cloud y Cold Starts en Tiers Gratuitos:** Agotar los 750h/mes o límites de memoria (512MB RAM) en Render/Fly.io por ejecutar navegadores headless o tener contenedores caídos. | 3 | 2 | **6 (Alta)** | Todo el Equipo | **Estrategia Local-First:** Desarrollar, probar y certificar todo en local con Docker Compose durante las Semanas 1 a 3. Desplegar a servidores cloud únicamente el MVP terminado al final de la Semana 3. |
| **R-03** | Datos / Divisas | **Caída o Cambio de Contrato de APIs de Cotización Financiera:** Que DolarAPI o Bluelytics dejen de responder o cambien la estructura de su JSON intempestivamente. | 2 | 3 | **6 (Alta)** | `E-API` | Implementación del **patrón Multi-Provider Fallback**: si DolarAPI falla, el cron consulta Bluelytics. Si ambas caen, entra en juego el **Fallback Cambiario de 72h** (`cotizacion_aproximada: true`). A las 72h+1s se aplica corte a `SIN_DATO` (RN-03). |
| **R-04** | Rendimiento UI | **Degradación del Navegador y Caída de FPS en Consultas Anuales:** Transferir y pintar más de 1.400 puntos por gráfica satura la memoria del navegador y congela el scroll en Next.js. | 2 | 2 | **4 (Media)** | `E-API` / `E-F/UX/UI` | Implementación de **Downsampling Semanal Obligatorio (HU-47 / RN-07)** para períodos $> 90$ días mediante la vista continua `agg_precios_semanales` en TimescaleDB, garantizando renderizado fluido a 60 FPS con un máximo de 53 puntos. |
| **R-05** | Integridad Numérica | **Contaminación Estadística por Inyección de Cero (RN-04):** Que un scraper o servicio de backend interprete una falta de stock como `$0.00`, distorsionando la mediana y el historial económico. | 1 | 3 | **3 (Media)** | `E-API` / `E-DB` | Blindaje en tres niveles: (1) Constraint en base de datos `chk_consistencia_dato`, (2) DTO de validación en NestJS arrojando HTTP 422 RFC 7807, y (3) Caso de prueba bloqueante `TC-MATH-03`. |
| **R-06** | Gobernanza | **Desalineación de Contratos entre Backend, Scraper y Frontend:** Que un equipo modifique nombres de campos o rutas sin previo aviso, rompiendo la integración. | 2 | 2 | **4 (Media)** | Tech Lead / `E-QA` | Uso vinculante y obligatorio de `02-API-Contracts-OpenAPI.md` y `03-Data-Model-TimescaleDB.md`. Status checks automáticos en GitHub Actions que bloquean cualquier PR que no pase el linter y compilador de tipos TypeScript / .NET. |

---

## 3. Protocolos de Contingencia y Fallbacks Técnicos Detallados

### 3.1 Protocolo Anti-Bloqueo de Scrapers (Contingencia R-01)
Si durante la ejecución de las corridas diarias de scraping en Fase 1, una de las tiendas piloto activa protecciones anti-bot impenetrables:
1. **Aislamiento por Tienda:** Hangfire marca únicamente la tarea de esa tienda específica como fallida sin interrumpir la extracción de las otras 3 tiendas (`HU-02`).
2. **Activación de Reintentos Exponenciales:** El job de Hangfire reintenta automáticamente a los 5, 15 y 45 minutos cambiando dinámicamente el viewport del navegador y el header de navegación.
3. **Fallback Offline (Plan de Emergencia para Demos):** Si el bloqueo persiste por más de 24 horas, `E-Scrapper` tiene autorizado activar el proveedor `OfflineFileSeederService`, el cual inyecta series de tiempo pre-capturadas y etiquetadas en `seed.json` para garantizar que la presentación ante el cliente o evaluadores cuente con datos continuos.

### 3.2 Protocolo de Desconexión Cambiaria (Contingencia R-03)
Ante caídas masivas en los servicios de provisión de divisas (DolarAPI / Bluelytics):

```mermaid
flowchart TD
    START["Consulta de Precio en Moneda Dura (USD)"] --> CHK{"¿Existe cotización de cierre<br/>para la fecha de la observación?"}
    CHK -- SÍ --> OK["Retorna precio_usd exacto<br/>cotizacion_aproximada = FALSE"]
    CHK -- NO --> AGE{"¿Antigüedad de la última<br/>cotización válida $\le 72$ horas?"}
    AGE -- SÍ (Feriado o corte $\le 3$ días) --> FALLBACK["Aplica última cotización conocida (LOCF)<br/>Retorna precio_usd<br/>Bandera: cotizacion_aproximada = TRUE (⚠️)"]
    AGE -- NO (Corte crítico $> 72$ horas) --> CUTOFF["Aplica Corte de Honestidad Estadística (RN-03)<br/>Retorna precio_usd = NULL<br/>estado_dato = 'SIN_DATO' (Corte en Gráfica)"]
```

### 3.3 Protocolo de Preservación de Servidores Cloud Gratuitos (Contingencia R-02)
Para evitar que los servicios en Render o Fly.io se deshabiliten o consuman el saldo mensual antes de la entrega final:
1. **Desarrollo 100% Aislado en Local:** Durante los Sprints 1 y 2, queda terminantemente prohibido levantar instancias activas en la nube para pruebas manuales o desarrollo individual.
2. **Base de Datos Compartida Local:** Todos los desarrolladores utilizan la misma configuración de Docker Compose `pricescope-db`.
3. **Plan de Despliegue en Ventana Única (Sprint 3):** Los contenedores en la nube se aprovisionan únicamente cuando el código de `apps/api`, `apps/client` y `apps/scraper` esté congelado (*feature freeze*) y certificado por `E-QA`.
4. **Hibernación Post-Validación:** Si se detecta un consumo acelerado de horas de servidor, el Tech Lead configurará el apagado automático del worker de scraping nocturno, ejecutándolo bajo demanda para la sesión de demostración comercial.

---

## 4. Matriz de Escalado y Comunicación de Incidentes

Cuando un riesgo se materializa en un bloqueo efectivo de desarrollo, se aplica la siguiente ruta de resolución:

| Nivel de Escalamiento | Tiempo Máximo de Respuesta | Responsable de Decisión | Acción Inmediata |
| :--- | :---: | :--- | :--- |
| **Nivel 1: Técnico / Código** | 2 horas | Lead de la Célula Afectada | Diagnóstico en local, revisión de logs y propuesta de solución o bypass. |
| **Nivel 2: Integración Cruzada** | 4 horas | Tech Lead (`Gonzalo Cecchín`) | Llamada express de 15 minutos entre los leads involucrados (`E-API`, `E-Scrapper` o `E-F/UX/UI`) para ajustar contrato o fallback. |
| **Nivel 3: Compromiso de Alcance** | Mismo día | Tech Lead + Equipo Completo | Activación de poda de alcance (ej. posponer la tienda afectada a Fase 1.5 y mantener el MVP con 3 tiendas totalmente funcionales). |
