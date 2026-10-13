# Pipeline (Python)

Scaffolding inicial para scrapers y extracción de datos.

## Entorno virtual

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

## Estructura

- `scrapers/base`: clases y utilidades base para extracción.
- `scrapers/sources`: scrapers por fuente.
- `data/raw`: datos crudos.
- `data/processed`: datos procesados.
