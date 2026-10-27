<p align="center">
  <img src="../assets/imagotipo.png" alt="PriceScope Logo" width="360"/>
</p>

# Estrategia de Ambientes, Configuracion y Despliegue Cloud
**PriceScope - Monitor de Inflacion Real Multimoneda**  
*Plataforma B2B de Analitica Economica e Inteligencia de Mercado*

---

## Metadatos del Documento

| Atributo | Detalle Oficial |
| :--- | :--- |
| **Codigo del Documento** | **`PLN-ENV-V1.0`** |
| **Proyecto** | PriceScope - Monitor de Inflacion Real Multimoneda |
| **Organizacion / Programa** | Simulacion Laboral Abierta - NoCountry |
| **Sector de Negocio** | FinTech / Analitica Economica (B2B Analytics) |
| **Version** | **1.0** (Estandar de Infraestructura y Despliegues) |
| **Fecha de Emision** | 23 de Octubre de 2026 |
| **Ubicacion en Repositorio** | `docs/02-planeacion/04-Estrategia-Despliegue-Ambientes.md` |
| **Documentos Vinculantes** | `03-Data-Model-TimescaleDB.md`, `05-Software-Architecture-Pipeline.md`, `01-Plan-Operativo-Roadmap.md`, `02-matriz-riesgos.md`, `apps/database/README.md` |
| **Estado** | Aprobado para Ejecucion y Certificacion Cloud |

---

## 1. Topologia de Ambientes

PriceScope opera bajo una arquitectura de tres entornos delimitados para preservar la estabilidad operativa y cumplir la estrategia Local-First:

```mermaid
flowchart LR
    subgraph Local ["1. Local Development (Docker Compose)"]
        L_DB["TimescaleDB pg16<br/>localhost:5432"]
        L_API["NestJS 12 API<br/>localhost:3001"]
        L_CLI["Next.js 16 Client<br/>localhost:3000"]
        L_SCRAP["Hangfire Worker .NET<br/>localhost:5000"]
    end

    subgraph Staging ["2. Staging / Certificacion QA"]
        S_DB["Neon Cloud Serverless<br/>PostgreSQL 16 + TimescaleDB"]
        S_API["Render / Fly.io Staging<br/>api-staging.pricescope.internal"]
        S_CLI["Vercel Preview<br/>client-preview.vercel.app"]
    end

    subgraph Prod ["3. Produccion Cloud (MVP B2B)"]
        P_DB["Neon Cloud Production<br/>PostgreSQL 16 + TimescaleDB"]
        P_API["Render / Fly.io Prod<br/>api.pricescope.app"]
        P_CLI["Vercel Production<br/>pricescope.app"]
        P_SCRAP["Worker Cron Container<br/>Hangfire Dashboard"]
    end

    Local -->|Sign-Off QA P0| Staging
    Staging -->|Aprobacion Tech Lead| Prod
```

### Caracteristicas por Entorno:
1. **Entorno Local (Local-First - Sprints 1 a 3):**
   * Persistencia unificada mediante `docker compose up -d timescaledb` (`timescale/timescaledb:latest-pg16`).
   * Frontend con soporte de mocks automáticos si el backend no está disponible.
   * Cero consumo de cuotas gratuitas de infraestructura cloud durante la construcción activa.
2. **Entorno Staging (Homologacion QA):**
   * Desplegado para la ejecución final de la matriz de 18 casos de prueba.
   * Conectado a base de datos Neon Serverless con el script DDL [`apps/database/init.sql`](../../apps/database/init.sql).
3. **Entorno Produccion (Fase 1 Demo B2B):**
   * Dominio público de alta disponibilidad optimizado para inversores y jurado de NoCountry.

---

## 2. Matriz de Variables de Entorno por Subsistema

### 2.1 Frontend Web (`apps/client/`)

| Variable | Tipo | Descripcion | Valor Local | Valor Staging / Produccion |
| :--- | :---: | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | String | URL base de la API REST NestJS. | `http://localhost:3001` (o vacio para mocks) | `https://api.pricescope.app` |
| `NODE_ENV` | String | Modo de ejecucion de Node.js. | `development` | `production` |

> **Comportamiento Local-First:** Si `NEXT_PUBLIC_API_URL` no está definida o está vacía, el cliente activa automáticamente el adaptador de mocks locales (`src/mocks/`), garantizando autonomía total para diseño y demostraciones offline.

### 2.2 Backend REST (`apps/api/`)

| Variable | Tipo | Descripcion | Valor Local | Valor Staging / Produccion |
| :--- | :---: | :--- | :--- | :--- |
| `PORT` | Number | Puerto de escucha del servidor HTTP. | `3001` | `3001` (o asignado por host) |
| `DATABASE_URL` | String | Cadena de conexion completa a PostgreSQL / TimescaleDB. | `postgresql://postgres:postgres@localhost:5432/pricescope` | `postgresql://user:pass@ep-xyz.neon.tech/pricescope?sslmode=require` |
| `DB_HOST` | String | Host de la base de datos. | `localhost` | `ep-xyz.neon.tech` |
| `DB_PORT` | Number | Puerto de base de datos. | `5432` | `5432` |
| `DB_USER` | String | Usuario de base de datos. | `postgres` | Usuario provisto por Neon |
| `DB_PASSWORD` | String | Clave de base de datos. | `postgres` | Clave secreta provista por Neon |
| `DB_NAME` | String | Nombre de la base de datos. | `pricescope` | `pricescope` |
| `DOLAR_API_URL` | String | URL de consulta para cotizacion oficial y blue. | `https://dolarapi.com/v1/dolares` | `https://dolarapi.com/v1/dolares` |
| `BLUELYTICS_API_URL` | String | Proveedor de contingencia cambiaria (R-03). | `https://api.bluelytics.com.ar/v2/latest` | `https://api.bluelytics.com.ar/v2/latest` |

### 2.3 Scraper Worker (`apps/scraper/src/Worker/`)

| Variable | Tipo | Descripcion | Valor Local | Valor Staging / Produccion |
| :--- | :---: | :--- | :--- | :--- |
| `ConnectionStrings__Postgres` | String | Cadena de conexion a PostgreSQL para Hangfire y datos. | `Host=localhost;Port=5432;Database=pricescope;Username=postgres;Password=postgres` | Cadena Neon Cloud con SSL |
| `ASPNETCORE_ENVIRONMENT` | String | Entorno de ejecucion ASP.NET Core. | `Development` | `Production` |
| `PLAYWRIGHT_HEADLESS` | Boolean | Ejecucion de Chromium sin interfaz grafica. | `true` | `true` |
| `HANGFIRE_CRON_SCHEDULE` | String | Expresion cron de extraccion nocturna (ART UTC-3). | `0 3 * * *` (03:00 ART) | `0 3 * * *` (03:00 ART) |

---

## 3. Guia de Despliegue por Plataforma Cloud

### 3.1 Base de Datos: Neon Cloud Serverless (PostgreSQL 16 + TimescaleDB)
1. Crear proyecto en [Neon.tech](https://neon.tech) seleccionando region `us-east` o `sa-east` con PostgreSQL 16.
2. Habilitar la extension `timescaledb` (Apache 2.0) en **Project Settings > Extensions**.
3. En el **SQL Editor** de Neon, ejecutar el script oficial e idempotente [`apps/database/init.sql`](../../apps/database/init.sql).
4. El script configurara automaticamente:
   - Extensiones (`uuid-ossp`, `timescaledb`).
   - ENUMs idempotentes (`moneda_enum`, `estado_observacion_enum`, `calidad_dato_enum`).
   - Tablas maestras, hypertables particionadas e indices.
   - Datos semilla de tiendas piloto y categorias.

### 3.2 Frontend: Vercel (Next.js 16 + React 19)
1. Importar el repositorio en Vercel seleccionando como **Root Directory**: `apps/client`.
2. Configurar el Framework Preset como **Next.js**.
3. Asignar la variable de entorno `NEXT_PUBLIC_API_URL` apuntando a la URL del backend en produccion.
4. Ejecutar el despliegue con Turbopack activado.

### 3.3 Backend API: Render / Fly.io (NestJS 12)
1. Crear servicio web con entorno Node.js, configurando **Root Directory**: `apps/api`.
2. Comando de Build: `npm install && npm run build`.
3. Comando de Inicio: `node dist/main.js`.
4. Inyectar las variables de entorno de conexion a Neon (`DATABASE_URL`).

### 3.4 Scraper Worker: Container / Background Worker
1. Compilar el contenedor Docker desde `apps/scraper/src/Worker/Dockerfile`.
2. Proveer flags Chromium `--no-sandbox` y `--disable-dev-shm-usage` para evitar OOM Kills (R-02).
3. Asegurar que el dashboard `/hangfire` cuente con proteccion de credenciales basicas antes de la exposicion externa.

---

## 4. Checklist de Pre-Vuelo para Pase a Produccion (Pre-Flight)

Antes de autorizar la apertura publica del sistema, se debe validar:

* [ ] **Base de Datos:** DDL ejecutado al 100% sin advertencias en Neon y seed inicial verificado.
* [ ] **Continuous Aggregate:** Vista `agg_precios_semanales` materializada y refrescada correctamente.
* [ ] **Cierre Cambiario (RN-01):** Verificada la presencia de cotizaciones USD a las 23:59:59 ART.
* [ ] **Regla Anti-Cero (RN-04):** Cero registros con precio `$0.00` en la base de datos.
* [ ] **Paginacion y 422 (RN-06 / RN-09):** Endpoint `/alerts` paginado estrictamente a 50 y consultas mayores a 365 dias rechazadas.
* [ ] **Fluidez UI:** Dashboard ejecutandose a 60 FPS sin memory leaks en interaccion con el grafico.
* [ ] **Fallback de Mocks:** Frontend operativo con datos de contingencia si se interrumpe la conexion de red.

---

## 5. Protocolo de Rollback y Recuperacion ante Desastres

En caso de fallo critico durante el pase a produccion:
1. **Fallo en API / Base de Datos:** Conmutar inmediatamente el frontend al **Modo Mock Transparente** vaciando temporalmente `NEXT_PUBLIC_API_URL` en Vercel. Esto garantiza disponibilidad ininterrumpida para jurados y clientes con datos sintéticos realistas.
2. **Fallo en Scrapers:** Activar el `OfflineFileSeederService` para reinyectar el dataset canonico pre-etiquetado sin afectar la experiencia de usuario.
3. **Reversion de Version:** Git tag previo de release estable redeployado en Vercel con un solo click.
