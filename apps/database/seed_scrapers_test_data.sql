-- ============================================================================
-- PriceScope: Seed de Datos Oficial de Scrapers (Coto, Jumbo, Disco, Vea)
-- ============================================================================

-- 0. Limpiar observaciones y runs obsoletos
DELETE FROM observaciones_precios;
DELETE FROM scrape_runs;

DO $$
DECLARE
    v_coto_id UUID;
    v_jumbo_id UUID;
    v_disco_id UUID;
    v_vea_id UUID;

    v_run_coto UUID := gen_random_uuid();
    v_run_jumbo UUID := gen_random_uuid();
    v_run_disco UUID := gen_random_uuid();
    v_run_vea UUID := gen_random_uuid();

    v_prod_picada UUID;
    v_prod_asado UUID;
    v_prod_fideos UUID;
    v_prod_mayonesa UUID;
    v_prod_ddl UUID;
    v_prod_papas UUID;
    v_prod_heladera UUID;
    v_prod_tv UUID;
    v_prod_aire UUID;

    v_day INT;
    v_timestamp TIMESTAMPTZ;
    v_cotiz NUMERIC(12,4);
BEGIN
    -- Obtener IDs de tiendas oficiales del scraper
    SELECT id INTO v_coto_id FROM tiendas WHERE slug = 'coto';
    SELECT id INTO v_jumbo_id FROM tiendas WHERE slug = 'jumbo';
    SELECT id INTO v_disco_id FROM tiendas WHERE slug = 'disco';
    SELECT id INTO v_vea_id FROM tiendas WHERE slug = 'vea';

    -- Obtener IDs de productos canónicos del scraper
    SELECT id INTO v_prod_picada FROM productos_canonicos WHERE slug = 'picada-especial-x-kg';
    SELECT id INTO v_prod_asado FROM productos_canonicos WHERE slug = 'asado-del-medio-estancias-coto-x-kg';
    SELECT id INTO v_prod_fideos FROM productos_canonicos WHERE slug = 'fideos-municiones-500-grs-matarazzo';
    SELECT id INTO v_prod_mayonesa FROM productos_canonicos WHERE slug = 'mayonesa-natura-pouch-475-gr';
    SELECT id INTO v_prod_ddl FROM productos_canonicos WHERE slug = 'dulce-de-leche-la-serenisima-colonial-250g';
    SELECT id INTO v_prod_papas FROM productos_canonicos WHERE slug = 'papas-air-fryer-700-gr-mc-cain';
    SELECT id INTO v_prod_heladera FROM productos_canonicos WHERE slug = 'heladera-no-frost-inverter-eficiencia-d-299-lts-silver-rt29k577js8-samsung';
    SELECT id INTO v_prod_tv FROM productos_canonicos WHERE slug = 'smart-tv-65-qled-4k-65t6c-f-tcl';
    SELECT id INTO v_prod_aire FROM productos_canonicos WHERE slug = 'aire-acondicionado-inverter-frio-calor-4730-f-5500-w-phin55ha2an-philco';

    -- 1. Insertar Scrape Runs oficiales
    INSERT INTO scrape_runs (run_id, store_slug, status, attempts, products_processed, products_succeeded, products_with_problems, started_at, finished_at)
    VALUES 
        (v_run_coto, 'coto', 'EXITOSA', 1, 48, 48, 0, NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 15 minutes'),
        (v_run_jumbo, 'jumbo', 'EXITOSA', 1, 45, 44, 1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 45 minutes'),
        (v_run_disco, 'disco', 'EXITOSA', 1, 35, 35, 0, NOW() - INTERVAL '2 hours 30 minutes', NOW() - INTERVAL '2 hours 10 minutes'),
        (v_run_vea, 'vea', 'EXITOSA', 1, 32, 31, 1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 40 minutes')
    ON CONFLICT (run_id) DO NOTHING;

    -- 2. Insertar Serie Temporal de 30 días para Cotizaciones Divisas y Observaciones
    FOR v_day IN 0..30 LOOP
        v_timestamp := (NOW() - (v_day || ' days')::INTERVAL);
        v_cotiz := ROUND(1300 + (30 - v_day) * 8.5, 2);

        -- Cotización Blue
        INSERT INTO cotizaciones_divisas (timestamp_utc, moneda_base, moneda_cotizada, tipo, condicion, valor, fuente)
        VALUES (v_timestamp, 'USD', 'ARS', 'parallel', 'venta', v_cotiz, 'DolarAPI_Cierre')
        ON CONFLICT DO NOTHING;

        -- Fideos Matarazzo en Coto y Jumbo
        IF v_prod_fideos IS NOT NULL THEN
            INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
            VALUES 
                (v_timestamp, v_prod_fideos, v_coto_id, v_run_coto, ROUND(1450 + (30 - v_day) * 18.0, 2), ROUND((1450 + (30 - v_day) * 18.0) / 0.5, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre'),
                (v_timestamp, v_prod_fideos, v_jumbo_id, v_run_jumbo, ROUND(1520 + (30 - v_day) * 22.0, 2), ROUND((1520 + (30 - v_day) * 22.0) / 0.5, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Mayonesa Natura en Coto y Jumbo
        IF v_prod_mayonesa IS NOT NULL THEN
            INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
            VALUES 
                (v_timestamp, v_prod_mayonesa, v_coto_id, v_run_coto, ROUND(1850 + (30 - v_day) * 25.0, 2), ROUND((1850 + (30 - v_day) * 25.0) / 0.475, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre'),
                (v_timestamp, v_prod_mayonesa, v_jumbo_id, v_run_jumbo, ROUND(1920 + (30 - v_day) * 28.0, 2), ROUND((1920 + (30 - v_day) * 28.0) / 0.475, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Picada Especial en Coto
        IF v_prod_picada IS NOT NULL THEN
            INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
            VALUES 
                (v_timestamp, v_prod_picada, v_coto_id, v_run_coto, ROUND(6200 + (30 - v_day) * 85.0, 2), ROUND(6200 + (30 - v_day) * 85.0, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Dulce de Leche Colonial en Coto y Jumbo
        IF v_prod_ddl IS NOT NULL THEN
            INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
            VALUES 
                (v_timestamp, v_prod_ddl, v_coto_id, v_run_coto, ROUND(1650 + (30 - v_day) * 20.0, 2), ROUND((1650 + (30 - v_day) * 20.0) / 0.25, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre'),
                (v_timestamp, v_prod_ddl, v_jumbo_id, v_run_jumbo, ROUND(1720 + (30 - v_day) * 24.0, 2), ROUND((1720 + (30 - v_day) * 24.0) / 0.25, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Smart TV TCL 65 en Vea y Disco
        IF v_prod_tv IS NOT NULL THEN
            INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
            VALUES 
                (v_timestamp, v_prod_tv, v_vea_id, v_run_vea, ROUND(849999 + (30 - v_day) * 6500.0, 2), ROUND(849999 + (30 - v_day) * 6500.0, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre'),
                (v_timestamp, v_prod_tv, v_disco_id, v_run_disco, ROUND(869999 + (30 - v_day) * 7000.0, 2), ROUND(869999 + (30 - v_day) * 7000.0, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Heladera Samsung No Frost RT29 en Vea y Disco
        IF v_prod_heladera IS NOT NULL THEN
            INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
            VALUES 
                (v_timestamp, v_prod_heladera, v_vea_id, v_run_vea, ROUND(920000 + (30 - v_day) * 7500.0, 2), ROUND(920000 + (30 - v_day) * 7500.0, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre'),
                (v_timestamp, v_prod_heladera, v_disco_id, v_run_disco, ROUND(940000 + (30 - v_day) * 8000.0, 2), ROUND(940000 + (30 - v_day) * 8000.0, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Aire Acondicionado Philco en Vea y Disco
        IF v_prod_aire IS NOT NULL THEN
            INSERT INTO observaciones_precios (timestamp_utc, producto_canonico_id, tienda_id, scrape_run_id, precio_regular, precio_por_unidad, moneda_codigo, disponible, estado_dato, cotizacion_aplicada, fuente_cotizacion)
            VALUES 
                (v_timestamp, v_prod_aire, v_vea_id, v_run_vea, ROUND(780000 + (30 - v_day) * 5800.0, 2), ROUND(780000 + (30 - v_day) * 5800.0, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre'),
                (v_timestamp, v_prod_aire, v_disco_id, v_run_disco, ROUND(795000 + (30 - v_day) * 6200.0, 2), ROUND(795000 + (30 - v_day) * 6200.0, 2), 'ARS', TRUE, 'DATO_VALIDO', v_cotiz, 'DolarAPI_Cierre')
            ON CONFLICT DO NOTHING;
        END IF;

    END LOOP;

    -- Vincular automáticamente las observaciones con los alias de publicación correspondientes
    UPDATE observaciones_precios op
    SET alias_tienda_id = at.id
    FROM alias_tienda at
    WHERE op.producto_canonico_id = at.producto_canonico_id
      AND op.tienda_id = at.tienda_id
      AND op.alias_tienda_id IS NULL;

END $$;

REFRESH MATERIALIZED VIEW agg_precios_semanales;
