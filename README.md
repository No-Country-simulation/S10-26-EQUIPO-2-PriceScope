<p align="center">
  <img src="docs/assets/imagotipo.png" alt="PriceScope Logo" width="450"/>
</p>

<h1 align="center"><strong>PriceScope - Monitor de Inflacion Real Multimoneda</strong></h1>

<p align="center">
  <strong>Plataforma B2B de Analitica Economica e Inteligencia de Mercado</strong><br>
  <em>Simulacion Laboral Abierta - NoCountry (Cohorte 2026 / Equipo S10-26-EQUIPO-2)</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/NestJS-12-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 10" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/TimescaleDB-PostgreSQL_16-FDB515?style=for-the-badge&logo=postgresql&logoColor=black" alt="TimescaleDB" />
  <img src="https://img.shields.io/badge/Playwright_.NET-Headless-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/Hangfire-Background_Jobs-007ACC?style=for-the-badge" alt="Hangfire" />
</p>

---

## Tabla de Contenidos
* [Acerca del Proyecto](#acerca-del-proyecto)
  * [El Problema](#el-problema)
  * [La Solucion (PriceScope)](#la-solucion-pricescope)
* [Tech Stack](#tech-stack)
* [Arquitectura del Monorepo](#arquitectura-del-monorepo)
* [Funcionalidades del MVP (Fase 1) y Plus (Fase 1.5)](#funcionalidades-del-mvp-fase-1-y-plus-fase-15)
* [Reglas Matematicas y de Negocio](#reglas-matematicas-y-de-negocio)
* [Instalacion y Puesta en Marcha Local](#instalacion-y-puesta-en-marcha-local)
* [Documentacion Tecnica Oficial](#documentacion-tecnica-oficial)
* [Equipo de Desarrollo (NoCountry)](#equipo-de-desarrollo-nocountry)

---

## Acerca del Proyecto

### Contexto y Sector de Negocio
**Sector:** FinTech / Inteligencia de Mercado (`B2B Analytics`) - *Tablero con Inflacion Real vs. Divisa*.

PriceScope simula la operacion de una **firma de analitica economica** que provee informes de variacion de precios e inflacion en tiempo real a cadenas minoristas, fondos de inversion y medios de comunicacion en mercados de alta volatilidad cambiaria. La organizacion monitorea el comportamiento de la canasta basica y bienes durables para ayudar a las empresas a ajustar sus listas de precios y cubrirse estrategicamente frente a la devaluacion.

### El Problema (Relevamiento Manual Ineficiente)
El equipo de analistas de la firma tradicionalmente realizaba un relevamiento manual visitando portales de e-commerce dos veces por semana, volcando datos artesanalmente en hojas de calculo y calculando la inflacion a mano.

Con un catalogo objetivo de **mas de 10.000 productos bajo observacion**, el proceso manual genera:
1. **Retrasos Criticos:** Imposibilidad de reaccionar oportunamente ante saltos cambiarios intradiarios.
2. **Errores Humanos:** Distorsion de indicadores por fallas de digitacion manual.
3. **Perdida de Trazabilidad ante Ofertas y Reduflacion:** Dificultad para discernir si una baja de precio es una promocion transitoria o reduccion de gramaje (*reduflacion / shrinkflation*).
4. **Dispersion y Nombres Heterogeneos:** Un mismo producto figura con descripciones, SKUs y formatos incompatibles en cada portal minorista.

### La Solucion Desarrollada (PriceScope)
PriceScope implementa un **sistema de monitoreo continuo y desatendido** compuesto por:
* **Pipeline de Extraccion Automatizado:** Workers programados en **ASP.NET Core (.NET 10) con Hangfire y Playwright .NET** que recolectan periodicamente precios en cadenas piloto, normalizando identidades y detectando anomalias.
* **Motor de Ingesta Cambiaria con Sellado Temporal:** Ingesta automatizada de cotizaciones oficiales y paralelas (DolarAPI / Bluelytics) sincronizadas al cierre formal del dia (23:59:59 ART) con protocolo de tolerancia y fallback de 72 horas.
* **Almacen de Series Temporales Optimizado:** Base de datos en **PostgreSQL 16 + TimescaleDB** con hypertables particionadas y agregaciones continuas, compatible con Docker local y Neon Cloud Serverless.
* **Dashboard Ejecutivo B2B:** Aplicacion web moderna en **Next.js 16 (React 19, TypeScript), Tailwind CSS v4, Radix UI y Recharts 3.10** con soporte Local-First (modo mock transparente) y navegacion fluida a 60 FPS.
* **Modulo de Alertas e Historial de Trazabilidad:** Deteccion automatica de productos cuyo aumento supera la devaluacion cambiaria, auditoria inmutable (*append-only*) y exportacion de datos.

---

## Tech Stack

| Capa / Dominio | Tecnologias y Librerias Principales |
| :--- | :--- |
| **Frontend Web** | **Next.js 16.4** (App Router, Turbopack), **React 19**, **Tailwind CSS v4**, **Recharts 3.10 + Tremor Raw**, **Radix UI**, **@remixicon/react**, **date-fns**, **Vitest**, **Playwright Test** |
| **Backend REST & Servicios** | **NestJS 12**, **Node.js (TypeScript)**, **oxlint**, **Class-Validator**, **RxJS** |
| **Extraccion & Scraping** | **.NET 10 (C#)**, **Hangfire 1.8 (PostgreSQL Storage)**, **Playwright .NET**, **Npgsql 10** |
| **Persistencia & Series Temporales** | **PostgreSQL 16 + TimescaleDB 2.x** (Hypertables particionadas, compatible con Neon Cloud Serverless y Docker) |
| **DevOps & CI/CD** | **Docker Compose**, **GitHub Actions** (Pipelines independientes para Client, API y Scraper) |

---

## Arquitectura del Monorepo

El repositorio organiza sus servicios de forma desacoplada bajo el estandar de **Monorepo en `apps/`**:

```text
S10-26-EQUIPO-2-PriceScope/
├── .github/                      # CI/CD y Plantilla obligatoria de PRs
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/                # Workflows de GitHub Actions (Client, API, Scraper)
├── apps/
│   ├── client/                   # Frontend Web en Next.js 16 + React 19 + Tailwind v4
│   │   ├── docs/constitution.md  # Estandares de diseno y arquitectura frontend
│   │   ├── specs/                # Especificaciones de features (002, 003, 004)
│   │   └── src/                  # App Router, componentes, mocks, hooks y servicios
│   ├── api/                      # Backend REST en NestJS 12
│   │   └── src/                  # Modulos, controladores, servicios y configuracion
│   ├── scraper/                  # Sistema de extraccion en .NET 10
│   │   └── src/
│   │       ├── ScrapersLibrary/  # Biblioteca de abstracciones y scrapers por tienda
│   │       └── Worker/           # Worker ejecutable con Hangfire y PostgreSQL
│   └── database/                 # Persistencia e infraestructura compartida
│       ├── init.sql              # Script DDL oficial e idempotente (Tablas, Hypertables, Seed)
│       └── README.md             # Guia de configuracion local y Neon Cloud
├── docs/                         # Documentacion integral de analisis, planeacion y QA
│   ├── 01-analisis/              # 8 documentos canonicos (SRS, OpenAPI, DER, Reglas, etc.)
│   ├── 02-planeacion/            # Plan Operativo, Roadmap y Matriz de Riesgos
│   ├── 03-qa/                    # Espacio de certificacion, actas y pruebas de calidad
│   └── assets/                   # Logos, imagotipos y fotos del equipo
├── docker-compose.yml            # Orquestacion de TimescaleDB (PostgreSQL 16)
└── README.md                     # Documentacion general del repositorio
```

---

## Funcionalidades del MVP (Fase 1) y Plus (Fase 1.5)

### Fase 1: MVP Esencial (Local-First)
* **Tablero Ejecutivo B2B (`/`):** Grafica de evolucion temporal interactiva con alternancia instantanea entre Pesos ($), Dolar Blue y Dolar Oficial.
* **Filtros Temporales Dinamicos:** Rango libre (`fecha_desde` y `fecha_hasta` hasta 365 dias) con atajos rapidos (`30D`, `90D`, `1A`) y calendario popover.
* **Downsampling Algoritmico:** Agrupacion semanal transparente por mediana para rangos mayores a 90 dias, optimizando rendimiento a 60 FPS.
* **Banda Semaforica de Calidad:** Franja forense inferior que distingue estados de dato: Verde (`DATO_VALIDO`), Amarillo (`AGOTADO`) y Rojo (`ERROR_CAPTURA` / `SIN_DATO`).
* **Modulo de Alertas (`/alerts`):** Deteccion automatica de productos cuyo aumento supera la devaluacion, con filtros por categoria, severidad, tienda, paginacion y exportacion CSV.
* **Ficha de Trazabilidad (`/products/[id]/traceability`):** Auditoria historica inmutable (*append-only*), cotizacion exacta de cierre aplicada y deteccion de reduflacion.
* **Modo Mock Transparente:** El frontend conmuta a mocks locales si el backend no esta conectado, permitiendo desarrollo y revision sin friccion.

### Fase 1.5: Buffer Condicional (Post-MVP)
* **Panel de Administracion de Tiendas (`HU-01`):** Control y telemetria de scrapers en tiempo real.
* **Bandeja de Aprobacion de Zona Gris (`HU-10`):** Validacion manual para productos con similitud intermedia (0.41 <= S <= 0.84).
* **Ingesta HTTP Segura (`HU-06`):** Endpoint desacoplado `POST /api/v1/ingest/observations` con token API.

---

## Reglas Matematicas y de Negocio

* **RN-01 (Cierre del Dia):** Las cotizaciones cambiarias se emparejan con el ultimo valor registrado antes de las **23:59:59 ART** (UTC-3).
* **RN-02 (Prohibicion del Promedio Simple):** Las variaciones agregadas por categoria se calculan exclusivamente mediante la **Mediana Estadistica** para aislar distorsiones de outliers.
* **RN-03 (Tolerancia Cambiaria 72h):** Ante feriados bancarios o caidas de APIs financieras, se aplica cotizacion aproximada (LOCF) hasta 72 horas con advertencia. A las 72h+1s se aplica corte estricto (`SIN_DATO`).
* **RN-04 (Anti-Cero):** Prohibicion terminante de registrar o renderizar el valor numerico `0` ante falta de precio o stock.
* **RN-09 (Limite Temporal 365 Dias):** Consultas mayores a 365 dias se rechazan con codigo HTTP `422 Unprocessable Entity` para proteger la memoria del sistema.

---

## Instalacion y Puesta en Marcha Local

El proyecto sigue una estrategia **Local-First** mediante Docker Compose:

### 1. Clonar el Repositorio
```bash
git clone https://github.com/No-Country-simulation/S10-26-EQUIPO-2-PriceScope.git
cd S10-26-EQUIPO-2-PriceScope
```

### 2. Iniciar la Base de Datos Local (TimescaleDB / PostgreSQL 16)
```bash
docker compose up -d timescaledb
```
*Base de datos disponible en `localhost:5432` con tablas, hypertables y datos iniciales de `apps/database/init.sql`.*

### 3. Iniciar el Backend (NestJS 12)
```bash
cd apps/api
npm install
npm run start:dev
```
*API REST disponible en `http://localhost:3001`.*

### 4. Iniciar el Frontend (Next.js 16)
```bash
cd apps/client
npm install
npm run dev
```
*Aplicacion web disponible en `http://localhost:3000` (conmuta a mocks locales si el backend no esta levantado).*

### 5. Iniciar el Scraper Worker (.NET 10 / Hangfire)
```bash
cd apps/scraper/src/Worker
dotnet restore
dotnet run
```
*Dashboard de Hangfire disponible en `http://localhost:5000/hangfire`.*

---

## Documentacion Tecnica Oficial

Toda la documentacion de ingenieria, arquitectura y calidad se encuentra versionada en [`docs/`](docs/):

| Codigo | Documento Tecnico | Enlace |
| :--- | :--- | :--- |
| **`SRS`** | Especificacion de Requerimientos de Software y Backlog HUs | [01-SRS-PriceScope.md](docs/01-analisis/01-SRS-PriceScope.md) |
| **`API`** | Contratos OpenAPI 3.0, Endpoints y DTOs | [02-API-Contracts-OpenAPI.md](docs/01-analisis/02-API-Contracts-OpenAPI.md) |
| **`DB`** | Modelo de Datos TimescaleDB, DDL y Hypertables | [03-Data-Model-TimescaleDB.md](docs/01-analisis/03-Data-Model-TimescaleDB.md) |
| **`MATH`** | Reglas de Negocio, Mediana, Cierre UTC y Logica Financiera | [04-Business-Rules-Math-Logic.md](docs/01-analisis/04-Business-Rules-Math-Logic.md) |
| **`ARCH`** | Arquitectura de Software, Monorepo y Pipelines | [05-Software-Architecture-Pipeline.md](docs/01-analisis/05-Software-Architecture-Pipeline.md) |
| **`QA`** | Matriz de Casos de Prueba y Criterios de Aceptacion | [06-QA-Test-Matrix.md](docs/01-analisis/06-QA-Test-Matrix.md) |
| **`UIX`** | Especificaciones de Diseno UX/UI y Frontend | [07-Frontend-UX-UI-Specs.md](docs/01-analisis/07-Frontend-UX-UI-Specs.md) |
| **`USE`** | Especificacion de Casos de Uso (Flujos Formales) | [08-Casos-de-Uso-Use-Cases.md](docs/01-analisis/08-Casos-de-Uso-Use-Cases.md) |
| **`ROADMAP`** | Plan Operativo de Desarrollo y Roadmap | [01-Plan-Operativo-Roadmap.md](docs/02-planeacion/01-Plan-Operativo-Roadmap.md) |
| **`RISK`** | Matriz de Riesgos y Protocolos de Contingencia | [02-matriz-riesgos.md](docs/02-planeacion/02-matriz-riesgos.md) |
| **`RACI`** | Matriz RACI y Modelo de Gobernanza de Celulas | [03-Matriz-RACI-Gobernanza.md](docs/02-planeacion/03-Matriz-RACI-Gobernanza.md) |
| **`ENV`** | Estrategia de Ambientes y Despliegue Cloud | [04-Estrategia-Despliegue-Ambientes.md](docs/02-planeacion/04-Estrategia-Despliegue-Ambientes.md) |
| **`DEMO`** | Guion de Demostracion y Pitch Comercial B2B | [05-Guion-Demo-Presentacion-B2B.md](docs/02-planeacion/05-Guion-Demo-Presentacion-B2B.md) |
| **`E-QA`** | Espacio de Homologacion y Evidencias QA | [README.md (docs/03-qa)](docs/03-qa/README.md) |
| **`DESIGN`** | Estandares y Lineamientos Frontend | [constitution.md](apps/client/docs/constitution.md) |

---

## Equipo de Desarrollo (NoCountry)

### Equipo de Frontend & Experiencia de Usuario (`E-F/UX/UI`)

<table>
  <thead>
    <tr>
      <th align="center">
        <img src="docs/assets/team/juan-camilo-garcia.png" width="100" height="100" style="border-radius: 50%; object-fit: cover;" alt="Juan Camilo Garcia"><br>
        <strong>Juan Camilo Garcia</strong><br>
        <sub>Frontend Lead & UX/UI Designer</sub>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://www.linkedin.com/in/juan-camilo-garcia-" target="_blank">
          <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a><br>
        <a href="https://github.com/SnackMasterDev" target="_blank">
          <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
        </a>
      </td>
    </tr>
  </tbody>
</table>

### Equipo de Backend, Base de Datos y Divisas (`E-API`)

<table>
  <thead>
    <tr>
      <th align="center">
        <img src="docs/assets/team/luis-antonio-feliz.png" width="100" height="100" alt="Luis Feliz" style="border-radius: 50%; object-fit: cover;"><br>
        <strong>Luis Feliz</strong><br>
        <sub>Backend & DB Lead</sub>
      </th>
      <th align="center">
        <img src="docs/assets/team/yenny-castro.png" width="100" height="100" alt="Yenny Castro" style="border-radius: 50%; object-fit: cover;"><br>
        <strong>Yenny Castro</strong><br>
        <sub>Backend Developer</sub>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://www.linkedin.com/in/luis-antonio-feliz" target="_blank">
          <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a><br>
        <a href="https://github.com/LuisAntonioFeliz" target="_blank">
          <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
        </a>
      </td>
      <td align="center">
        <a href="https://www.linkedin.com/in/alexandra-castro-web-developer" target="_blank">
          <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a><br>
        <a href="https://github.com/YenCastro" target="_blank">
          <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
        </a>
      </td>
    </tr>
  </tbody>
</table>

### Equipo de Extraccion y Web Scraping (`E-Scrapper`)

<table>
  <thead>
    <tr>
      <th align="center">
        <img src="docs/assets/team/alejandro-hernandez.png" width="100" height="100" alt="Alejandro Hernandez OReilly" style="border-radius: 50%; object-fit: cover;"><br>
        <strong>Alejandro Hernandez OReilly</strong><br>
        <sub>Scraper Lead (.NET / Playwright)</sub>
      </th>
      <th align="center">
        <img src="docs/assets/team/anthony-ciprian.png" width="100" height="100" alt="Anthony Ciprian" style="border-radius: 50%; object-fit: cover;"><br>
        <strong>Anthony Ciprian</strong><br>
        <sub>Scraper Developer</sub>
      </th>
      <th align="center">
        <img src="docs/assets/isotipo.png" width="100" height="100" alt="Sebastian Torres" style="object-fit: contain;"><br>
        <strong>Sebastian Torres</strong><br>
        <sub>Scraper Developer</sub>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://www.linkedin.com/in/alejandro-hern%C3%A1ndez-o-reilly-0a0929312" target="_blank">
          <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a><br>
        <a href="https://github.com/Alejoho" target="_blank">
          <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
        </a>
      </td>
      <td align="center">
        <a href="https://www.linkedin.com/in/anthonyciprian" target="_blank">
          <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a><br>
        <a href="https://github.com/stuart-ware" target="_blank">
          <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
        </a>
      </td>
      <td align="center">
        <a href="#" target="_blank">
          <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a><br>
        <a href="#" target="_blank">
          <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
        </a>
      </td>
    </tr>
  </tbody>
</table>

### Equipo de Aseguramiento de Calidad y Homologacion (`E-QA`)

<table>
  <thead>
    <tr>
      <th align="center">
        <img src="docs/assets/team/gonzalo-cecchin.png" width="100" height="100" alt="Gonzalo Cecchin" style="border-radius: 50%; object-fit: cover;"><br>
        <strong>Gonzalo Cecchin</strong><br>
        <sub>Tech Lead / Product Owner Review</sub>
      </th>
      <th align="center">
        <img src="docs/assets/team/karina-luvianos.png" width="100" height="100" alt="Karina Luvianos" style="border-radius: 50%; object-fit: cover;"><br>
        <strong>Karina Luvianos</strong><br>
        <sub>QA Analyst Lead</sub>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://www.linkedin.com/in/gonzalo-cecch%C3%ADn" target="_blank">
          <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a><br>
        <a href="https://github.com/QAGonzaloCecchin" target="_blank">
          <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
        </a>
      </td>
      <td align="center">
        <a href="https://www.linkedin.com/in/kluvianosta" target="_blank">
          <img src="https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
        </a><br>
        <a href="https://github.com/Luvitaka" target="_blank">
          <img src="https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
        </a>
      </td>
    </tr>
  </tbody>
</table>
