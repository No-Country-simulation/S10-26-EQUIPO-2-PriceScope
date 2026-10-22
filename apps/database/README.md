# Capa de Base de Datos Compartida (TimescaleDB / PostgreSQL 16)
**PriceScope — Monitor de Inflación Real Multimoneda**

Este directorio centraliza los scripts de infraestructura, esquemas DDL y migraciones de la base de datos compartida utilizada por los microservicios del monorepo (`apps/scraper` y `apps/api`).

El script [`init.sql`](init.sql) es **100% compatible e idempotente** tanto para ejecución local con **Docker Compose** como en la nube con **Neon Cloud Serverless**.

---

## Estructura

```text
apps/database/
├── init.sql       # Script oficial DDL idempotente (Tablas, Hypertables, Vistas Materializadas, Índices y Seed)
└── README.md      # Guía de persistencia, compatibilidad y ejecución
```

---

## 1. Ejecución Local (Docker Compose)

Para levantar la base de datos localmente:

```bash
docker compose up -d
```

Esto inicializará el contenedor `pricescope-db` en el puerto `5432` y ejecutará automáticamente `init.sql` durante el primer arranque.

### Parámetros de Conexión Local:
- **Host:** `localhost`
- **Puerto:** `5432`
- **Usuario:** `postgres`
- **Contraseña:** `postgres`
- **Base de Datos:** `pricescope`
- **Cadena de Conexión Local:** `postgresql://postgres:postgres@localhost:5432/pricescope`

---

## 2. Despliegue en Neon Cloud (Serverless PostgreSQL 16)

Para desplegar en **Neon**:

1. En la consola de Neon, crea un nuevo proyecto con **PostgreSQL 16**.
2. Dirígete a **Project Settings > Extensions** y asegúrate de tener habilitada la extensión `timescaledb` (versión Apache 2.0).
3. Abre el **SQL Editor** en la consola de Neon y pega el contenido completo de [`init.sql`](init.sql).
4. Ejecuta el script. El script creará:
   - Extensiones (`uuid-ossp`, `timescaledb`).
   - Tipos enumerados de forma idempotente (`DO $$ ... EXCEPTION`).
   - Tablas maestras y tabla de telemetría de scrapers (`scrape_runs`).
   - Hypertables particionadas por tiempo.
   - Manejo tolerante a fallos para la compresión TSL (`timescaledb.compress` se omite limpiamente si no hay licencia TSL en la nube).
   - Vista materializada con índice único para refresco concurrente (`REFRESH MATERIALIZED VIEW CONCURRENTLY agg_precios_semanales`).
   - Población inicial idempotente (`tiendas`, `categorias`, `productos_canonicos`, `alias_tienda`).
