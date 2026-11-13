-- ============================================================================
-- PriceScope — Consultas Base para Cruce de Precios y Divisas (Demo Day)
-- ============================================================================

-- 1. Último precio por producto y tienda cruzado con dólar paralelo (USD)
SELECT
    pc.nombre_normalizado AS producto,
    c.nombre AS categoria,
    t.nombre AS tienda,
    o.timestamp_utc AS fecha_utc,
    o.precio_regular AS precio_ars,
    o.precio_por_unidad AS precio_unitario_ars,
    COALESCE(o.cotizacion_aplicada, cot.cotizacion_aplicada) AS dolar_ars,
    ROUND(
        o.precio_regular / NULLIF(COALESCE(o.cotizacion_aplicada, cot.cotizacion_aplicada), 0),
        2
    ) AS precio_usd,
    o.estado_dato
FROM observaciones_precios o
JOIN productos_canonicos pc ON pc.id = o.producto_canonico_id
JOIN categorias c ON c.id = pc.categoria_id
JOIN tiendas t ON t.id = o.tienda_id
LEFT JOIN LATERAL fn_obtener_cotizacion_cierre(o.timestamp_utc, 'parallel'::enum_tipo_cambio) cot ON TRUE
WHERE o.estado_dato = 'DATO_VALIDO'
ORDER BY o.timestamp_utc DESC, pc.nombre_normalizado, t.nombre;

-- 2. Comparativa diaria promedio ARS vs USD y brecha contra el dólar
WITH serie_diaria AS (
    SELECT
        DATE(o.timestamp_utc AT TIME ZONE 'America/Argentina/Buenos_Aires') AS dia_art,
        ROUND(AVG(o.precio_regular), 2) AS precio_promedio_ars,
        ROUND(AVG(o.precio_regular / NULLIF(COALESCE(o.cotizacion_aplicada, cot.cotizacion_aplicada), 0)), 2) AS precio_promedio_usd,
        ROUND(AVG(COALESCE(o.cotizacion_aplicada, cot.cotizacion_aplicada)), 2) AS dolar_cierre_ars
    FROM observaciones_precios o
    LEFT JOIN LATERAL fn_obtener_cotizacion_cierre(o.timestamp_utc, 'parallel'::enum_tipo_cambio) cot ON TRUE
    WHERE o.estado_dato = 'DATO_VALIDO'
    GROUP BY 1
)
SELECT
    dia_art,
    precio_promedio_ars,
    dolar_cierre_ars,
    precio_promedio_usd,
    ROUND(
        ((precio_promedio_ars - FIRST_VALUE(precio_promedio_ars) OVER (ORDER BY dia_art))
        / NULLIF(FIRST_VALUE(precio_promedio_ars) OVER (ORDER BY dia_art), 0)) * 100,
        2
    ) AS var_precio_ars_pct,
    ROUND(
        ((dolar_cierre_ars - FIRST_VALUE(dolar_cierre_ars) OVER (ORDER BY dia_art))
        / NULLIF(FIRST_VALUE(dolar_cierre_ars) OVER (ORDER BY dia_art), 0)) * 100,
        2
    ) AS var_dolar_pct
FROM serie_diaria
ORDER BY dia_art DESC;

-- 3. Últimas cotizaciones registradas en Neon (Oficial y Blue)
SELECT
    timestamp_utc,
    tipo,
    condicion,
    valor,
    fuente
FROM cotizaciones_divisas
ORDER BY timestamp_utc DESC, tipo, condicion
LIMIT 20;
