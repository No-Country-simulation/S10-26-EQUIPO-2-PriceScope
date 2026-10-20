# Raspadores diarios de tiendas

Este ejemplo usa Python 3.13, Redis como broker de Celery, un worker y un
proceso separado de Celery Beat. Beat programa `tasks.run_all_scrapers` una vez
al día a la medianoche UTC. La tarea ejecuta cada scraper registrado en `scrapers/`.

## Por agregar

Actualmente esto solo ejecuta todos los scrapers y registra los que fallan. Del documento de HU también debería incluirse:

1. Una funcionalidad para habilitar o deshabilitar tiendas desde el backend.
2. Este proceso debería ser idempotente, es decir, si una tienda falla a mitad del proceso, no debería volver a tomar productos ya tomados en esa ejecución.
3. Debe registrar en el backend información tal como: si la ejecución fue exitosa, o si falló( por qué ocurrió), además de las publicaciones vistas, guardadas, rechazadas y errores de cada tienda.

## Ejecutar

Instala Docker Desktop y luego inicia los servicios desde este directorio:

```sh
docker compose up --build
```

Abre Flower en <http://localhost:5555> para monitorear los workers y la actividad de las tareas.
El worker registra cada ejecución.

## Agregar mas scrapers

Crea un módulo bajo `scrapers/stores/` con una clase que tenga un atributo `name` y un método
`scrape()`, luego agrega una instancia a `SCRAPERS` en `scrapers/__init__.py`.
El ejemplo de scraper de tienda es un placeholder; reemplaza su método con la lógica de
obtención, análisis y persistencia de la tienda.

Mantén Beat con una sola instancia en ejecución. Varias instancias de Beat pueden encolar la
tarea diaria más de una vez. Las fallas de los scrapers se registran individualmente para que una
tienda que falle no impida que se ejecuten los demás scrapers.