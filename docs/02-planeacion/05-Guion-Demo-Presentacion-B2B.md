<p align="center">
  <img src="../assets/imagotipo.png" alt="PriceScope Logo" width="360"/>
</p>

# Guion de Demostracion y Pitch Comercial B2B (Demo Day)
**PriceScope - Monitor de Inflacion Real Multimoneda**  
*Plataforma B2B de Analitica Economica e Inteligencia de Mercado*

---

## Metadatos del Documento

| Atributo | Detalle Oficial |
| :--- | :--- |
| **Codigo del Documento** | **`PLN-DEMO-V1.0`** |
| **Proyecto** | PriceScope - Monitor de Inflacion Real Multimoneda |
| **Organizacion / Programa** | Simulacion Laboral Abierta - NoCountry (Cohorte 2026) |
| **Sector de Negocio** | FinTech / Analitica Economica (B2B Analytics) |
| **Version** | **1.0** (Guion Oficial para Demo Day e Inversores) |
| **Fecha de Emision** | 23 de Octubre de 2026 |
| **Ubicacion en Repositorio** | `docs/02-planeacion/05-Guion-Demo-Presentacion-B2B.md` |
| **Documentos Vinculantes** | `01-SRS-PriceScope.md`, `07-Frontend-UX-UI-Specs.md`, `08-Casos-de-Uso-Use-Cases.md`, `01-Plan-Operativo-Roadmap.md` |
| **Estado** | Aprobado para Preparacion de Defensa Final |

---

## 1. Declaracion de Posicionamiento y Propuesta de Valor (Elevator Pitch)

> *"En economias de alta volatilidad cambiaria, las empresas pierden millones ajustando sus listas de precios a ciegas o guiandose por indices oficiales que llegan con semanas de retraso. **PriceScope** es la primera plataforma B2B de inteligencia de mercado que monitorea en tiempo real la inflacion real y la dispersion de precios en las principales cadenas de retail, correlacionando automaticamente cada observacion con la cotizacion de la divisa y alertando anomalias y reduflacion antes de que afecten el margen del negocio."*

---

## 2. Estructura Cronometrada de la Presentacion (7 a 10 Minutos)

```mermaid
timeline
    title Cronograma del Pitch Demo Day (10 Minutos)
    00:00 - 02:00 : El Problema : Relevamiento manual ineficiente, retrasos de dias y distorsion cambiaria
    02:00 - 04:30 : Tablero Ejecutivo : Curva de inflacion real a 60 FPS, multimoneda y semaforo forense
    04:30 - 06:30 : Alertas e Hitos : Deteccion de aumentos que superan la devaluacion y exportacion CSV
    06:30 - 08:00 : Ficha Forense : Trazabilidad inmutable por SKU, deteccion de reduflacion y cierre ART
    08:00 - 09:30 : Ingenieria : Monorepo desacoplado, TimescaleDB PG16, Hangfire .NET y Next.js 16
    09:30 - 10:00 : Cierre y Q&A : Impacto de negocio y roadmap Fase 1.5
```

---

## 3. Guion Escenico Paso a Paso para la Demostracion en Vivo

### Bloque 1: Apertura y Planteamiento del Problema (Minuto 00:00 a 02:00)
* **Presentador Principal:** Tech Lead / Product Owner (`Gonzalo Cecchin`)
* **Pantalla Proyectada:** Diapositiva conceptual o Portada de PriceScope.
* **Narrativa:**
  * *"Hoy en dia, un equipo de analistas en una cadena minorista o fondo de inversion debe visitar manualmente hasta 15 portales de e-commerce, volcar precios a mano en Excel y convertirlos con calculadoras para entender el impacto cambiario."*
  * *"Con mas de 10.000 articulos en el mercado, este relevamiento artesanal produce retrasos criticos, errores de tipeo y la imposibilidad de detectar si una supuesta oferta oculta un recorte en el gramaje del producto (*shrinkflation*)."*
  * *"Para resolver esto, construimos PriceScope."*

---

### Bloque 2: Tablero Principal - Inflacion Real Multimoneda (Minuto 02:00 a 04:30)
* **Presentador:** Frontend Lead (`Juan Camilo Garcia`)
* **Pantalla Proyectada:** Ruta principal [`/`](http://localhost:3000) (Dashboard B2B).
* **Acciones en Vivo:**
  1. **Navegacion Fluida:** Mostrar el scroll y la carga instantanea del dashboard ejecutivo con tarjetas de KPIs (Inflacion Acumulada, Brecha Cambiaria, Productos Monitoreados).
  2. **Interaccion con la Grafica Temporal:** Senalar la serie temporal interactiva con **Recharts**. Pasar el mouse sobre los puntos para mostrar el tooltip con desglose simultaneo.
  3. **Conmutacion de Moneda:** Cambiar con un click entre **Pesos ($)**, **Dolar Blue** y **Dolar Oficial**, demostrando como la curva se recalcula y normaliza al instante segun el cierre cambiario formal a las 23:59:59 ART (RN-01).
  4. **Filtros y Downsampling (RN-07):** Seleccionar el atajo temporal `30D`, luego `90D` y finalmente `1A`. Explicar como el sistema aplica downsampling automatico semanal sin congelar el navegador, sosteniendo **60 FPS constantes**.
  5. **Banda Semaforica de Calidad:** Mostrar la franja inferior diaria que distingue de forma forense dias con dato valido (verde), quiebres de stock (amarillo) o cortes de cotizacion (rojo).

---

### Bloque 3: Modulo de Alertas e Inteligencia de Desvio (Minuto 04:30 a 06:30)
* **Presentador:** QA Lead (`Karina Luvianos`) / Backend Lead (`Luis Feliz`)
* **Pantalla Proyectada:** Ruta de alertas [`/alerts`](http://localhost:3000/alerts).
* **Acciones en Vivo:**
  1. **Deteccion de Picos Inflacionarios:** Explicar el filtro de severidad (Alta, Media, Baja). Mostrar aquellos articulos cuyo incremento porcentual supero la devaluacion cambiaria en la ventana evaluada.
  2. **Mediana Estadistica (RN-02):** Subrayar que los calculos evitan distorsiones por outliers al basarse exclusivamente en la mediana por categoria y no en promedios simples.
  3. **Paginacion Estricta y RFC 7807 (RN-06):** Navegar por las paginas acotadas a 50 registros para demostrar proteccion de memoria.
  4. **Exportacion de Datos:** Accionar el boton de descarga CSV, mostrando como un analista financiero puede exportar la evidencia para auditorias externas.

---

### Bloque 4: Ficha de Trazabilidad Forense y Reduflacion (Minuto 06:30 a 08:00)
* **Presentador:** Frontend Lead (`Juan Camilo Garcia`)
* **Pantalla Proyectada:** Ruta de detalle [`/products/{id}/traceability`](http://localhost:3000/products/1/traceability).
* **Acciones en Vivo:**
  1. **Ficha de Identidad del Producto:** Visualizar la ficha maestra (SKU canonico, marca, categoria y tiendas observadas).
  2. **Auditoria Historica Inmutable (*Append-Only*):** Mostrar la tabla historica con cada captura realizada por los scrapers, su sello de tiempo ART y la cotizacion aplicada.
  3. **Deteccion de Reduflacion:** Senalar la bandera de reduflacion cuando un producto mantiene el precio facial pero reduce su gramaje unitario, alertando el incremento real en el costo por kilogramo o litro.

---

### Bloque 5: Arquitectura Tecnologica y Solidez de Ingenieria (Minuto 08:00 a 09:30)
* **Presentador:** Backend Lead (`Luis Feliz`) / Scraper Lead (`Alejandro Hernandez`)
* **Pantalla Proyectada:** Diagrama de Arquitectura de [`docs/01-analisis/05-Software-Architecture-Pipeline.md`](../01-analisis/05-Software-Architecture-Pipeline.md).
* **Puntos Clave a Destacar:**
  * **Scraping Concurrente en .NET 10:** Workers con **Hangfire y Playwright .NET** con ejecuciones nocturnas programadas, reintentos exponenciales y Circuit Breakers para prevencion de bloqueos.
  * **TimescaleDB sobre PostgreSQL 16:** Hypertables particionadas con agregaciones continuas y compatibilidad directa con Neon Cloud Serverless.
  * **Backend NestJS 12:** Arquitectura modular con tipado estricto, contratos OpenAPI 3.0 y aislamiento de divisas.
  * **Frontend Next.js 16 con React 19:** Optimizacion con Turbopack, Tailwind CSS v4 y componentes modulares bajo estandares de Clean Code.

---

### Bloque 6: Cierre, Impacto de Negocio y Preguntas (Minuto 09:30 a 10:00)
* **Presentador:** Tech Lead (`Gonzalo Cecchin`)
* **Mensaje de Cierre:**
  * *"PriceScope transforma un relevamiento manual, tardio y propenso a errores en un activo estrategico en tiempo real para la toma de decisiones economicas."*
  * *"Apertura a preguntas del jurado y evaluadores."*

---

## 4. Matriz de Contingencias en Vivo (Plan de Respaldo ante Imprevistos)

| Escenario de Falla | Sintoma en Vivo | Accion Inmediata de Contingencia | Responsable |
| :--- | :--- | :--- | :---: |
| **Corte de Internet o Caida de API Cloud** | La aplicacion muestra error de red o spinner prolongado. | **Conmutacion a Modo Mock Transparente:** La aplicacion conmuta automaticamente a los datos simulados en local sin interrumpir la presentacion. | `Juan Camilo Garcia` |
| **Fallo en Scrapers de Tienda Externa** | Bloqueo temporal de IP o HTTP 403 en una tienda piloto. | Demostrar como el Circuit Breaker aisla la tienda fallida mientras las demas continuan operando, y activar `seed_dataset_offline.json`. | `Alejandro Hernandez` |
| **Caida de API de Cotizacion Financiera** | DolarAPI no responde. | Explicar el funcionamiento en vivo de la regla de contingencia **RN-03** (Fallback de 72h con advertencia visual ⚠️). | `Luis Feliz` |

---

## 5. Asignacion de Roles para el Equipo en el Demo Day

* **Maestro de Ceremonias / Vision de Negocio:** Gonzalo Cecchin (Tech Lead)
* **Demostracion de Interfaz y UX/UI:** Juan Camilo Garcia (Frontend Lead)
* **Explicacion de Persistencia y Modelos Matematicos:** Luis Feliz / Karina Luvianos
* **Operacion del Pipeline de Extraccion y Scraping:** Alejandro Hernandez OReilly / Anthony Ciprian
