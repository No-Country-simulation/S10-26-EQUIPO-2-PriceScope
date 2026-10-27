# PriceScope Scraping with Hangfire

Proyecto separado para comparar Hangfire con `scraping-csharp`. Usa PostgreSQL para el almacenamiento persistente de Hangfire y un esquema propio, `scraping_worker`, para guardar corridas y resultados sin asumir la estructura de productos de NestJS.

## Configuracion

Requiere .NET 10 y una base PostgreSQL existente. Define la cadena de conexión en `ConnectionStrings:Postgres`.

PowerShell:

```powershell
$env:ConnectionStrings__Postgres = "Host=localhost;Port=5432;Database=pricescope;Username=postgres;Password=postgres"
dotnet run --project scraping-hangfire/PriceScope.ScrapingHangfire.csproj
```

Hangfire crea su almacenamiento persistente en PostgreSQL. Al iniciar, el worker crea las tablas de resultados en `scraping_worker`. El dashboard queda disponible en `/hangfire`; protégelo con autenticación antes de exponerlo fuera del entorno local.

## Programacion y reintentos

Hangfire encola un trabajo independiente por tienda cada día a las 00:00 UTC. Cada corrida recibe un `Guid` que se conserva en todos sus reintentos. Los fallos del trabajo tienen hasta cinco reintentos, con demoras de 15, 30, 60, 120 y 240 segundos. Hangfire persiste el estado y el dashboard permite inspeccionar trabajos fallidos y programados.

## Resultados

Cada artículo se guarda al procesarse en `scraping_worker.scraped_products`. La clave `(run_id, external_id)` permite reintentar sin duplicar el resultado del artículo dentro de esa corrida. El JSON extraído se almacena en `data` (`jsonb`); `status` puede ser `Captured`, `Rejected` o `Error`.

`scraping_worker.scrape_runs` almacena el estado de la corrida, la tienda, el número de intentos, las fechas, el último error y los totales. `products_processed` cuenta resultados únicos; `products_succeeded` incluye artículos capturados o rechazados correctamente; `products_with_problems` cuenta resultados con estado `Error`. Si una tienda falla a mitad de recorrido, los resultados ya guardados y sus totales se conservan.

## Agregar tiendas

Implementa `IStoreScraper` y registra cada implementación en `Program.cs` como `IStoreScraper`. Produce un `ScrapedProduct` por artículo procesado. Para fallos de toda la tienda que deban reintentarse, lanza una excepción; para problemas aislados de un artículo, produce un resultado con estado `Error`.

El scraper de ejemplo sigue siendo un placeholder, igual que en el proyecto Python. Este proyecto persiste los resultados de scraping en su esquema propio; todavía no inserta productos en las tablas de negocio de NestJS.