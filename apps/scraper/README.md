# Scraper de PriceScope (.NET)

El scraper es un worker ASP.NET Core en .NET 10 que programa trabajos recurrentes por tienda con Hangfire.

- `src/Worker`: aplicación, configuración, dashboard y trabajos de Hangfire.
- `src/ScrapersLibrary`: contratos, scrapers, proveedores de productos y repositorios de corridas.
- PostgreSQL almacena el estado de Hangfire, las corridas (`scrape_runs`) y las observaciones de precios (`observaciones_precios`).

## Requisitos

- .NET SDK 10 y una instancia de PostgreSQL accesible que tenga el esquema de PriceScope.
- Docker Desktop con Docker Compose v2 compatible con la propiedad `include`, o

## Ejecutar el worker localmente

Desde la raíz del repositorio, inicia PostgreSQL con el compose principal:

```powershell
docker compose up -d timescaledb
```

Configura la cadena de conexión para el proceso local, el username y password para el dashboard de Hangfire y ejecuta el Worker:

```powershell
dotnet user-secrets set "ConnectionStrings:Postgres" "Host=localhost;Port=5432;Database=pricescope;Username=postgres;Password=postgres" --project apps/scraper/src/Worker/Worker.csproj
dotnet user-secrets set "Hangfire:Dashboard:Username" "admin" --project apps/scraper/src/Worker/Worker.csproj
dotnet user-secrets set "Hangfire:Dashboard:Password" "<una contraseña segura>" --project apps/scraper/src/Worker/Worker.csproj
dotnet run --project apps/scraper/src/Worker/Worker.csproj
```

El dashboard de Hangfire que muestra los recurring jobs estará en https://localhost:7479/hangfire/recurring y solicitará autenticación HTTP Basic. La aplicación requiere `ConnectionStrings:Postgres` y credenciales no vacías en `Hangfire:Dashboard:Username` y `Hangfire:Dashboard:Password`; falla al iniciar si falta alguna configuración requerida. No expongas el dashboard por HTTP sin un proxy TLS.

## Ejecutar con Docker Compose

Define `POSTGRES_CONNECTION`, `HANGFIRE_DASHBOARD_USERNAME` y `HANGFIRE_DASHBOARD_PASSWORD` en el entorno o en un archivo `.env`. Después corre este comando:

```powershell
docker compose -f apps/scraper/src/compose.yaml up --build
```

El compose del scraper incluye el [`docker-compose.yml`](../../docker-compose.yml) raíz, que define PostgreSQL/TimescaleDB y el volumen `pgdata`. También inicia el worker y pgAdmin. El worker se conecta a PostgreSQL mediante el nombre de servicio `timescaledb`.

- Worker: <http://localhost:8080/>
- Dashboard de Hangfire: <http://localhost:8080/hangfire>
- pgAdmin: <http://localhost:15432/> (usuario `admin@pricescope.com`, contraseña `admin`)
- PostgreSQL desde el host: `localhost:5432` (base `pricescope`, usuario y contraseña `postgres`)

Para registrar la base en pgAdmin, usa el host `timescaledb`, puerto `5432`, base `pricescope` y las credenciales `postgres` / `postgres`.

## Agregar una tienda

1. Carga la tienda en `tiendas` y asegúrate de que su slug coincida con el `StoreSlug` del scraper.
2. Crea los productos canónicos y sus alias en `productos_canonicos` y `alias_tienda`; el proveedor PostgreSQL solo devuelve alias activos.
3. Implementa `IStoreScraper` en `ScrapersLibrary` y procesa los productos como `IAsyncEnumerable<ScrapedProduct>`.
4. Registra la implementación en [`src/Worker/Program.cs`](src/Worker/Program.cs) como `IStoreScraper`.

El worker programará automáticamente un trabajo recurrente para cada scraper registrado. Los resultados se guardan mediante `PostgresScrapeRepository`; cada producto debe cumplir las validaciones del repositorio y el esquema de PostgreSQL.
