-- ============================================================================
-- PriceScope: Seed de Datos de Prueba para Integración Local
-- ============================================================================

DO $$
DECLARE
    v_carrefour_id UUID;
    v_jumbo_id UUID;
    v_fravega_id UUID;
    v_musimundo_id UUID;
    v_run_carrefour UUID := gen_random_uuid();
    v_run_jumbo UUID := gen_random_uuid();
    v_run_fravega UUID := gen_random_uuid();
    v_run_musimundo UUID := gen_random_uuid();
    v_prod_cafe UUID;
    v_prod_aceite UUID;
    v_prod_leche UUID;
    v_prod_arroz UUID;
    v_prod_tv UUID;
    v_prod_heladera UUID;
    v_prod_lavarropas UUID;
    v_day INT;
    v_timestamp TIMESTAMPTZ;
    v_cotiz NUMERIC(12,4);
BEGIN
    -- Obtener IDs de tiendas
    SELECT id INTO v_carrefour_id FROM tiendas WHERE slug = 'carrefour';
    SELECT id INTO v_jumbo_id FROM tiendas WHERE slug = 'jumbo';
    SELECT id INTO v_fravega_id FROM tiendas WHERE slug = 'fravega';
    SELECT id INTO v_musimundo_id FROM tiendas WHERE slug = 'musimundo';

    -- Obtener IDs de productos canónicos
    SELECT id INTO v_prod_cafe FROM productos_canonicos WHERE slug = 'prod-cafe-molido-la-morenita-500g';
    SELECT id INTO v_prod_aceite FROM productos_canonicos WHERE slug = 'prod-aceite-girasol-natura-1-5l';
    SELECT id INTO v_prod_leche FROM productos_canonicos WHERE slug = 'prod-leche-entera-la-serenisima-1l';
    SELECT id INTO v_prod_arroz FROM productos_canonicos WHERE slug = 'prod-arroz-largo-fino-lucchetti-1kg';
    SELECT id INTO v_prod_tv FROM productos_canonicos WHERE slug = 'prod-smarttv-samsung-55-du7000-4k';
    SELECT id INTO v_prod_heladera FROM productos_canonicos WHERE slug = 'prod-heladera-gafa-hgn358b-310l';
    SELECT id INTO v_prod_lavarropas FROM productos_canonicos WHERE slug = 'prod-lavarropas-drean-next-8-12-8kg';

    -- 1. Insertar Scrape Runs recientes (telemetría viva)
    INSERT INTO scrape_runs (run_id, store_slug, status, attempts, products_processed, products_succeeded, products_with_problems, started_at, finished_at)
    VALUES 
        (v_run_carrefour, 'carrefour', 'EXITOSA', 1, 42, 42, 0, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 45 minutes'),
        (v_run_jumbo, 'jumbo', 'EXITOSA', 1, 38, 37, 1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 40 minutes'),
        (v_run_fravega, 'fravega', 'EXITOSA', 1, 25, 25, 0, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 50 minutes'),
        (v_run_musimundo, 'musimundo', 'ADVERTENCIA', 2, 22, 20, 2, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 40 minutes')
    ON CONFLICT (run_id) DO NOTHING;

    -- 2. Insertar Serie Temporal de 30 días para Cotizaciones Divisas y Observaciones
    FOR v_day IN 0..30 LOOP
        v_timestamp := (NOW() - (v_day || ' days')::INTERVAL);
        v_cotiz := ROUND(1300 + (30 - v_day) * 8.5, 2);

        -- Cotización Blue
        INSERT INTO cotizaciones_divisas (timestamp_utc, moneda_base, moneda_cotizada, tipo, condicion, valor, fuente)
        VALUES (v_timestamp, 'USD', 'ARS', 'parallel', 'venta', v_cotiz, 'DolarAPI_Cierre')
        ON CONFLICT DO NOTHING;

        -- Observaciones Café La Morenita en Carrefour y Jumbo
        INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
        VALUES 
            (v_timestamp, v_prod_cafe, v_carrefour_id, v_run_carrefour, ROUND(4800 + (30 - v_day) * 65.0, 2), ROUND((4800 + (30 - v_day) * 65.0) / 0.5, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre'),
            (v_timestamp, v_prod_cafe, v_jumbo_id, v_run_jumbo, ROUND(4950 + (30 - v_day) * 70.0, 2), ROUND((4950 + (30 - v_day) * 70.0) / 0.5, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
        ON CONFLICT DO NOTHING;

        -- Observaciones Aceite Natura
        INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
        VALUES 
            (v_timestamp, v_prod_aceite, v_carrefour_id, v_run_carrefour, ROUND(2800 + (30 - v_day) * 35.0, 2), ROUND((2800 + (30 - v_day) * 35.0) / 1.5, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre'),
            (v_timestamp, v_prod_aceite, v_jumbo_id, v_run_jumbo, ROUND(2900 + (30 - v_day) * 40.0, 2), ROUND((2900 + (30 - v_day) * 40.0) / 1.5, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
        ON CONFLICT DO NOTHING;

        -- Observaciones Smart TV en Frávega y Musimundo
        INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
        VALUES 
            (v_timestamp, v_prod_tv, v_fravega_id, v_run_fravega, ROUND(699999 + (30 - v_day) * 4500.0, 2), ROUND(699999 + (30 - v_day) * 4500.0, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre'),
            (v_timestamp, v_prod_tv, v_musimundo_id, v_run_musimundo, ROUND(719999 + (30 - v_day) * 5000.0, 2), ROUND(719999 + (30 - v_day) * 5000.0, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
        ON CONFLICT DO NOTHING;
    END LOOP;

END $$;

REFRESH MATERIALIZED VIEW agg_precios_semanales;
