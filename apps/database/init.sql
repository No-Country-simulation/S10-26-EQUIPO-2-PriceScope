-- ============================================================================
-- PriceScope — Script Oficial de Inicialización de Base de Datos
-- PostgreSQL 16 con extensión TimescaleDB 2.x (Compatible Neon + Docker)
-- ============================================================================

-- 00. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================================================
-- 01. CREACIÓN DE ENUMS (Idempotentes)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE enum_tipo_tienda AS ENUM ('supermercado', 'electro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_unidad_medida AS ENUM ('kg', 'L', 'unidad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_estado_dato AS ENUM ('DATO_VALIDO', 'AGOTADO', 'ERROR_CAPTURA', 'SIN_DATO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_tipo_cambio AS ENUM ('oficial', 'parallel', 'mep', 'ccl');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_condicion_cambio AS ENUM ('venta', 'compra');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_tipo_hito AS ENUM ('AUTOMATICO', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enum_estado_corrida AS ENUM ('PENDIENTE', 'EN_PROCESO', 'EXITOSA', 'ADVERTENCIA', 'FALLIDA', 'ABORTADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 02. TABLAS MAESTRAS Y OPERACIONALES (CON UUIDs Y SLUGS DETERMINÍSTICOS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tiendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    url_base TEXT NOT NULL,
    tipo enum_tipo_tienda NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_tiendas_url_base CHECK (url_base ~ '^https?://')
);

CREATE TABLE IF NOT EXISTS productos_canonicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    marca VARCHAR(150) NOT NULL,
    modelo VARCHAR(150),
    nombre_normalizado VARCHAR(255) NOT NULL,
    contenido_neto_valor NUMERIC(10, 4) NOT NULL CHECK (contenido_neto_valor > 0),
    contenido_neto_unidad enum_unidad_medida NOT NULL,
    pack VARCHAR(20) NOT NULL DEFAULT 'x1',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alias_tienda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_canonico_id UUID NOT NULL REFERENCES productos_canonicos(id) ON DELETE RESTRICT,
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE RESTRICT,
    url_origen TEXT NOT NULL,
    alias_producto VARCHAR(300) NOT NULL,
    sku_tienda VARCHAR(150),
    score_matching NUMERIC(3, 2) CHECK (score_matching BETWEEN 0 AND 1),
    metodo_matching VARCHAR(50) NOT NULL DEFAULT 'MANUAL_SEED',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_alias_url_origen CHECK (url_origen ~ '^https?://'),
    CONSTRAINT uq_alias_tienda_url UNIQUE (tienda_id, url_origen),
    CONSTRAINT uq_alias_tienda_sku UNIQUE (tienda_id, sku_tienda)
);

CREATE TABLE IF NOT EXISTS scrape_runs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_slug VARCHAR(50) NOT NULL REFERENCES tiendas(slug) ON DELETE RESTRICT,
    status enum_estado_corrida NOT NULL DEFAULT 'PENDIENTE',
    attempts INTEGER NOT NULL DEFAULT 1,
    products_processed INTEGER NOT NULL DEFAULT 0,
    products_succeeded INTEGER NOT NULL DEFAULT 0,
    products_with_problems INTEGER NOT NULL DEFAULT 0,
    circuit_breaker_open BOOLEAN NOT NULL DEFAULT FALSE,
    fallback_activo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    last_error TEXT
);

CREATE TABLE IF NOT EXISTS historial_contenido (
    id BIGSERIAL PRIMARY KEY,
    producto_canonico_id UUID NOT NULL REFERENCES productos_canonicos(id) ON DELETE RESTRICT,
    contenido_neto_valor NUMERIC(10, 4) NOT NULL CHECK (contenido_neto_valor > 0),
    contenido_neto_unidad enum_unidad_medida NOT NULL,
    pack VARCHAR(20) NOT NULL DEFAULT 'x1',
    motivo_evento VARCHAR(50) NOT NULL DEFAULT 'REDUFLACION',
    fecha_desde_utc TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 03. TABLAS TEMPORALES PREVIAS A HIPERTABLAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS observaciones_precios (
    timestamp_utc TIMESTAMPTZ NOT NULL,
    producto_canonico_id UUID NOT NULL REFERENCES productos_canonicos(id) ON DELETE RESTRICT,
    tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE RESTRICT,
    alias_tienda_id UUID REFERENCES alias_tienda(id) ON DELETE RESTRICT,
    scrape_run_id UUID REFERENCES scrape_runs(run_id) ON DELETE SET NULL,
    precio_regular NUMERIC(14, 2) CHECK (precio_regular IS NULL OR precio_regular > 0),
    precio_promocional NUMERIC(14, 2) CHECK (precio_promocional IS NULL OR precio_promocional > 0),
    precio_por_unidad NUMERIC(14, 4) CHECK (precio_por_unidad IS NULL OR precio_por_unidad > 0),
    moneda_codigo CHAR(3) NOT NULL DEFAULT 'ARS',
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    estado_dato enum_estado_dato NOT NULL,
    cotizacion_aplicada NUMERIC(12, 4) CHECK (cotizacion_aplicada IS NULL OR cotizacion_aplicada > 0),
    cotizacion_aproximada BOOLEAN NOT NULL DEFAULT FALSE,
    fuente_cotizacion VARCHAR(50),
    motivo_faltante VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timestamp_utc, producto_canonico_id, tienda_id),
    CONSTRAINT chk_consistencia_dato CHECK (
        (estado_dato = 'DATO_VALIDO' AND precio_regular IS NOT NULL AND precio_regular > 0 AND disponible = TRUE) OR
        (estado_dato IN ('AGOTADO', 'ERROR_CAPTURA', 'SIN_DATO') AND precio_regular IS NULL AND precio_promocional IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS cotizaciones_divisas (
    timestamp_utc TIMESTAMPTZ NOT NULL,
    moneda_base VARCHAR(3) NOT NULL DEFAULT 'USD',
    moneda_cotizada VARCHAR(3) NOT NULL DEFAULT 'ARS',
    tipo enum_tipo_cambio NOT NULL,
    condicion enum_condicion_cambio NOT NULL DEFAULT 'venta',
    valor NUMERIC(12, 4) NOT NULL CHECK (valor > 0),
    fuente VARCHAR(50) NOT NULL,
    url_fuente TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (timestamp_utc, moneda_base, moneda_cotizada, tipo, condicion, fuente),
    CONSTRAINT ck_divisas_url CHECK (url_fuente IS NULL OR url_fuente ~ '^https?://')
);

-- ============================================================================
-- 04. CONVERSIÓN A HIPERTABLAS (TimescaleDB)
-- ============================================================================
SELECT create_hypertable(
    'observaciones_precios', 
    'timestamp_utc', 
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

SELECT create_hypertable(
    'cotizaciones_divisas', 
    'timestamp_utc', 
    chunk_time_interval => INTERVAL '30 days',
    if_not_exists => TRUE
);

-- ============================================================================
-- 05. TABLAS DE HITOS Y AUDITORÍA
-- ============================================================================
CREATE TABLE IF NOT EXISTS hitos_economicos (
    id BIGSERIAL PRIMARY KEY,
    timestamp_utc TIMESTAMPTZ NOT NULL,
    producto_canonico_id UUID REFERENCES productos_canonicos(id) ON DELETE SET NULL,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    tipo enum_tipo_hito NOT NULL DEFAULT 'AUTOMATICO',
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auditoria_cambios (
    id BIGSERIAL PRIMARY KEY,
    timestamp_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tabla_afectada VARCHAR(100) NOT NULL,
    registro_id VARCHAR(100) NOT NULL,
    operacion VARCHAR(20) NOT NULL,
    valor_anterior JSONB,
    valor_nuevo JSONB,
    usuario_responsable VARCHAR(100) NOT NULL,
    motivo TEXT NOT NULL
);

-- ============================================================================
-- 06. ÍNDICES DE ALTO RENDIMIENTO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_obs_producto_time ON observaciones_precios (producto_canonico_id, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_obs_tienda_time ON observaciones_precios (tienda_id, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_obs_listing_time ON observaciones_precios (alias_tienda_id, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_obs_scrape_run ON observaciones_precios (scrape_run_id);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_slug_fecha ON scrape_runs (store_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_tipo_time ON cotizaciones_divisas (tipo, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_alias_url ON alias_tienda (url_origen);
CREATE INDEX IF NOT EXISTS idx_alias_canonico ON alias_tienda (producto_canonico_id);
CREATE INDEX IF NOT EXISTS idx_hitos_producto_time ON hitos_economicos (producto_canonico_id, timestamp_utc DESC);

-- ============================================================================
-- 07. POLÍTICA DE COMPRESIÓN (Graceful Degradation para Neon Apache 2.0)
-- ============================================================================
DO $$
BEGIN
    EXECUTE 'ALTER TABLE observaciones_precios SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = ''producto_canonico_id, tienda_id'',
        timescaledb.compress_orderby = ''timestamp_utc DESC''
    )';
    PERFORM add_compression_policy('observaciones_precios', INTERVAL '30 days', if_not_exists => TRUE);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Compresión TSL omitida (Entorno Apache 2.0 detectado en Neon).';
END $$;

-- ============================================================================
-- 08. AGREGACIÓN SEMANAL (Materialized View compatible con percentile_cont)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS agg_precios_semanales AS
SELECT 
    time_bucket('1 week', timestamp_utc) AS semana_utc,
    producto_canonico_id,
    tienda_id,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY precio_regular) AS precio_regular_mediana,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY precio_por_unidad) AS precio_unidad_mediana,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY (precio_regular / cotizacion_aplicada)) AS precio_usd_mediana,
    COUNT(*) FILTER (WHERE estado_dato = 'DATO_VALIDO') AS mediciones_validas,
    COUNT(*) FILTER (WHERE estado_dato = 'AGOTADO') AS mediciones_agotado,
    COUNT(*) FILTER (WHERE estado_dato = 'ERROR_CAPTURA') AS mediciones_error
FROM observaciones_precios
GROUP BY semana_utc, producto_canonico_id, tienda_id
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agg_precios_semanales_pk 
ON agg_precios_semanales (semana_utc, producto_canonico_id, tienda_id);

-- Inicializa la vista por primera vez para que la API pueda consultarla aunque esté vacía:
REFRESH MATERIALIZED VIEW agg_precios_semanales;
-- ============================================================================
-- 09. FUNCIÓN DE SINCRONIZACIÓN CAMBIARIA AL CIERRE (23:59:59 ART / TTL 72h)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_obtener_cotizacion_cierre(
    p_fecha_captura TIMESTAMPTZ,
    p_tipo_cambio enum_tipo_cambio DEFAULT 'parallel'
)
RETURNS TABLE (
    cotizacion_aplicada NUMERIC(12,4),
    cotizacion_aproximada BOOLEAN,
    fuente_cotizacion VARCHAR(50),
    estado_sincronizacion VARCHAR(20)
) AS $$
DECLARE
    v_cierre_local_utc TIMESTAMPTZ;
    v_limite_ttl_utc TIMESTAMPTZ;
BEGIN
    v_cierre_local_utc := (
        (timezone('America/Argentina/Buenos_Aires', p_fecha_captura)::DATE || ' 23:59:59')::TIMESTAMP
    ) AT TIME ZONE 'America/Argentina/Buenos_Aires';

    v_limite_ttl_utc := v_cierre_local_utc - INTERVAL '72 hours';

    RETURN QUERY
    SELECT 
        c.valor,
        (c.timestamp_utc < (v_cierre_local_utc - INTERVAL '24 hours')) AS cotizacion_aproximada,
        c.fuente,
        'OK'::VARCHAR(20) AS estado_sincronizacion
    FROM cotizaciones_divisas c
    WHERE c.tipo = p_tipo_cambio
      AND c.condicion = 'venta'
      AND c.timestamp_utc <= v_cierre_local_utc
      AND c.timestamp_utc >= v_limite_ttl_utc
    ORDER BY c.timestamp_utc DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::NUMERIC(12,4), FALSE, NULL::VARCHAR(50), 'SIN_DATO'::VARCHAR(20);
    END IF;
END;

INSERT INTO tiendas (slug, nombre, url_base, tipo) VALUES
('coto', 'Coto Argentina', 'https://www.coto.com.ar', 'supermercado'),
('jumbo', 'Jumbo Argentina', 'https://www.jumbo.com.ar', 'supermercado'),
('disco', 'Disco Argentina', 'https://www.disco.com.ar', 'electro'),
('vea', 'Vea Argentina', 'https://www.vea.com.ar', 'electro')
ON CONFLICT (slug) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    url_base = EXCLUDED.url_base,
    tipo = EXCLUDED.tipo;

INSERT INTO productos_canonicos (
	slug,
	categoria_id,
	marca,
	modelo,
	nombre_normalizado,
	contenido_neto_valor,
	contenido_neto_unidad,
	pack
) VALUES 
(
	'prod-choclo-entero-ciudad-del-lago-300g',
	(SELECT id FROM categorias WHERE slug = 'canasta-basica'),
	'Ciudad del Lago',
	'Entero',
	'Choclo Entero Ciudad Del Lago 300 Gr',
	'0.3',
	'kg',
	'x1'
),
(
	'prod-atun-desmenuzado-al-natural-ciudad-del-lago-170g',
	(SELECT id FROM categorias WHERE slug = 'canasta-basica'),
	'Ciudad del Lago',
	'Desmenuzado',
	'Atún Desmenuzado Al Natural Ciudad Del Lago 170g',
	'0.17',
	'kg',
	'x1'
), 
(
	'prod-granos-choclos-amarillos-enteros-coto-300g',
	(SELECT id FROM categorias WHERE slug = 'canasta-basica'),
	'Coto',
	'Entero',
	'Granos de choclo amarillo enteros COTO 300g',
	'0.3',
	'kg',
	'x1'
),
(
	'prod-porotos-negros-coto-350g',
	(SELECT id FROM categorias WHERE slug = 'canasta-basica'),
	'Coto',
	'Negros',
	'Porotos negros COTO 350g',
	'0.35',
	'kg',
	'x1'
),
(
	'prod-suprema-pollo-granel-fresca',
	(SELECT id FROM categorias WHERE slug = 'canasta-basica'),
	'Jumbo',
	'Suprema de pollo',
	'Suprema De Pollo Granel Fresca',
	'1',
	'kg',
	'x1'
),
(
	'prod-milanesa-cerdo-rebozada',
	(SELECT id FROM categorias WHERE slug = 'canasta-basica'),
	'Jumbo',
	'Milanesa de Cerdo',
	'Milanesa De Cerdo Rebozada',
	'1',
	'kg',
	'x1'
),
(
	'prod-pollo-fresco-con-menudos',
	(SELECT id FROM categorias WHERE slug = 'canasta-basica'),
	'Jumbo',
	'Pollo Fresco',
	'Pollo Fresco Con Menudos',
	'1',
	'kg',
	'x1'
),
(
	'prod-roast-beef-churrasco-novitillo',
	(SELECT id FROM categorias WHERE slug = 'canasta-basica'),
	'La Hacienda',
	'Churrasco',
	'Roast Beef Churrasco Novillito',
	'1',
	'kg',
	'x1'
),
(
    'prod-mouse-inalambrico-ergonomico-pilas-nex',
    (SELECT id FROM categorias WHERE slug = 'bienes-durables'),
    'Nex',
    'Msinaerg',
    'Mouse Inalámbrico Ergonómico A Pilas Nex',
    '1',
    'unidad',
    'x1'
)
ON CONFLICT (slug) DO UPDATE SET
	nombre_normalizado = EXCLUDED.nombre_normalizado,
	contenido_neto_valor = EXCLUDED.contenido_neto_valor,
	contenido_neto_unidad = EXCLUDED.contenido_neto_unidad,
	pack = EXCLUDED.pack, -- Esto fue agregado para asegurar que los cambios en el pack se reflejen correctamente
	updated_at = NOW();   -- verificá el nombre real de la columna

INSERT INTO alias_tienda (
	producto_canonico_id,
	tienda_id,
	alias_producto,
	sku_tienda,
	url_origen,
	metodo_matching
) VALUES
(
	-- Choclo
	(SELECT id FROM productos_canonicos WHERE slug = 'prod-choclo-entero-ciudad-del-lago-300g'),
	(SELECT id FROM tiendas WHERE slug = 'coto'),
	'Choclo Entero',
	'2800004817349', -- EL SKU ES EL EAN del supermercado
	'https://www.coto.com.ar/productos/choclo-entero-ciudad-del-lago-300-gr-/_/R-00481734-00481734-200',
	'MANUAL_SEED'
),
(
	-- Atún
	(SELECT id FROM productos_canonicos WHERE slug = 'prod-atun-desmenuzado-al-natural-ciudad-del-lago-170g'),
	(SELECT id FROM tiendas WHERE slug = 'coto'),
	'Atún Desmenuzado',
	'2800000707019',
	'https://www.coto.com.ar/productos/atun-desmenuzado-al-natural-ciudad-del-lago-170g-/_/R-00070701-00070701-200',
	'MANUAL_SEED'
),
(
	-- Grano de choclo
	(SELECT id FROM productos_canonicos WHERE slug = 'prod-granos-choclos-amarillos-enteros-coto-300g'),
	(SELECT id FROM tiendas WHERE slug = 'coto'),
	'Granos de Choclo',
	'2800006099293',
	'https://www.coto.com.ar/productos/granos-de-choclo-amarillo-enteros-coto-300g-/_/R-00609929-00609929-200',
	'MANUAL_SEED'
),
(
	-- Porotos negros
	(SELECT id FROM productos_canonicos WHERE slug = 'prod-porotos-negros-coto-350g'),
	(SELECT id FROM tiendas WHERE slug = 'coto'),
	'Porotos',
	'2800005827613',
	'https://www.coto.com.ar/productos/porotos-negros-coto-350g-/_/R-00582761-00582761-200',
	'MANUAL_SEED'
),
(	-- Supremas de pollo
	(SELECT id FROM productos_canonicos WHERE slug = 'prod-suprema-pollo-granel-fresca'),
	(SELECT id FROM tiendas WHERE slug = 'jumbo'),
	'Suprema de pollo',
	'22460226001',
	'https://www.jumbo.com.ar/suprema-de-pollo-granel-fresca/p',
	'MANUAL_SEED'
),
(	-- Milanesa de cerdo
	(SELECT id FROM productos_canonicos WHERE slug = 'prod-milanesa-cerdo-rebozada'),
	(SELECT id FROM tiendas WHERE slug = 'jumbo'),
	'Milasena de Cerdo',
	'22820301004',
	'https://www.jumbo.com.ar/milanesa-de-cerdo-rebozada-2/p',
	'MANUAL_SEED'
),
(
	-- Pollo fresco
	(SELECT id FROM productos_canonicos WHERE slug = 'prod-pollo-fresco-con-menudos'),
	(SELECT id FROM tiendas WHERE slug = 'jumbo'),
	'Pollo fresco',
	'22440106001',
	'https://www.jumbo.com.ar/pollo-fresco-con-menudos-3/p',
	'MANUAL_SEED'
),
(
	-- Churrasco
	(SELECT id FROM productos_canonicos WHERE slug = 'prod-roast-beef-churrasco-novitillo'),
	(SELECT id FROM tiendas WHERE slug = 'jumbo'),
	'Churrasco',
	'22140415001',
	'https://www.jumbo.com.ar/roast-beef-churrasco-novillito/p',
	'MANUAL_SEED'
),
(
    -- Mouse ergonomico
    (SELECT id FROM productos_canonicos WHERE slug = 'prod-mouse-inalambrico-ergonomico-pilas-nex'),
    (SELECT id FROM tiendas WHERE slug = 'disco'),
    'Mouse',
    '61131876007',
    'https://www.disco.com.ar/mouse-inalambrico-ergonomico-a-pilas-nex/p',
    'MANUAL_SEED'
)
 ON CONFLICT (tienda_id, url_origen) DO UPDATE SET 
    alias_producto = EXCLUDED.alias_producto,
    sku_tienda = EXCLUDED.sku_tienda;

$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 10. POBLACIÓN DETERMINÍSTICA BASE (HU-00 Seed Data Idempotente)
-- ============================================================================
INSERT INTO categorias (slug, nombre, descripcion) VALUES
('canasta-basica', 'Canasta Básica', 'Alimentos y artículos de primera necesidad (consumo masivo)'),
('bienes-durables', 'Bienes Durables', 'Electrodomésticos y tecnología para el hogar')
ON CONFLICT (slug) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

INSERT INTO tiendas (slug, nombre, url_base, tipo) VALUES
('coto', 'Coto Argentina', 'https://www.coto.com.ar', 'supermercado'),
('jumbo', 'Jumbo Argentina', 'https://www.jumbo.com.ar', 'supermercado'),
('disco', 'Disco Argentina', 'https://www.disco.com.ar', 'electro'),
('vea', 'Vea Argentina', 'https://www.vea.com.ar', 'electro')
ON CONFLICT (slug) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    url_base = EXCLUDED.url_base,
    tipo = EXCLUDED.tipo;

INSERT INTO productos_canonicos (
	slug,
	categoria_id,
	marca,
	modelo,
	nombre_normalizado,
	contenido_neto_valor,
	contenido_neto_unidad,
	pack
) VALUES 
-- canasta basica
('picada-especial-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Picada Especial X KG', 1, 'kg', 'x1'),
('asado-del-medio-estancias-coto-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Estancias Coto', NULL, 'Asado Del Medio Estancias Coto X KG', 1, 'kg', 'x1'),
('nalga-estancias-coto-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Nalga Estancias Coto X KG', 1, 'kg', 'x1'),
('cuadrada-novillito-estancias-coto-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Estancias Coto', NULL, 'Cuadrada Novillito Estancias Coto X Kg', 1, 'kg', 'x1'),
('cuadril-selección-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Cuadril Selección X KG', 1, 'kg', 'x1'),
('picada-desgrasada-estancias-coto-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Estancias Coto', NULL, 'Picada Desgrasada Estancias Coto X KG', 1, 'kg', 'x1'),
('bondiola-de-cerdo-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Bondiola De Cerdo X KG', 1, 'kg', 'x1'),
('roast-beef-estancias-coto-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Estancias Coto', NULL, 'Roast Beef Estancias Coto X KG', 1, 'kg', 'x1'),
('bola-de-lomo-estancias-coto-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Estancias Coto', NULL, 'Bola De Lomo Estancias Coto X KG', 1, 'kg', 'x1'),
('carré-de-cerdo-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Carré De Cerdo X KG', 1, 'kg', 'x1'),
('chuleta-de-paleta-de-cerdo-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Chuleta De Paleta De Cerdo X KG', 1, 'kg', 'x1'),
('tapa-de-asado-especial-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Tapa De Asado Especial X KG', 1, 'kg', 'x1'),
('pechito-con-manta-de-cerdo-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Pechito Con Manta De Cerdo X KG', 1, 'kg', 'x1'),
('vacío-del-centro-estancias-coto-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Estancias Coto', NULL, 'Vacío Del Centro Estancias Coto X KG', 1, 'kg', 'x1'),
('tapa-de-nalga-estancias-coto-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Estancias Coto', NULL, 'Tapa De Nalga Estancias Coto X KG', 1, 'kg', 'x1'),
('chuleta-de-jamón-de-cerdo-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Chuleta De Jamón De Cerdo X KG', 1, 'kg', 'x1'),
('osobuco-de-garron-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Osobuco De Garron X KG', 1, 'kg', 'x1'),
('picada-de-cerdo-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'Coto', NULL, 'Picada De Cerdo X KG', 1, 'kg', 'x1'),
('suprema-de-pollo-granel-fresca', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'GRANJA PROPIA', NULL, 'Suprema De Pollo Granel Fresca', 1, 'kg', 'x1'),
('picada-especial', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Picada Especial', 1, 'kg', 'x1'),
('cuarto-trasero-de-pollo-granel-fresco', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'GRANJA PROPIA', NULL, 'Cuarto Trasero De Pollo Granel Fresco', 1, 'kg', 'x1'),
('roast-beef-churrasco-novillito', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Roast Beef Churrasco Novillito', 1, 'kg', 'x1'),
('carré-de-cerdo-deshuesado-congelado', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'GRANJA PROPIA', NULL, 'Carré De Cerdo Deshuesado Congelado', 1, 'kg', 'x1'),
('colita-de-cuadril-novillito', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Colita De Cuadril Novillito', 1, 'kg', 'x1'),
('tapa-de-nalga-novillito', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Tapa De Nalga Novillito', 1, 'kg', 'x1'),
('bife-angosto-la-hacienda', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Bife Angosto La Hacienda', 1, 'kg', 'x1'),
('milanesa-nalga-novillito', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Milanesa Nalga Novillito', 1, 'kg', 'x1'),
('bondiola-de-cerdo-fresca-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'GRANJA PROPIA', NULL, 'Bondiola De Cerdo Fresca X Kg', 1, 'kg', 'x1'),
('bondiola-de-cerdo-congelada', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'GRANJA PROPIA', NULL, 'Bondiola De Cerdo Congelada', 1, 'kg', 'x1'),
('pollo-fresco-con-menudos', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'GRANJA PROPIA', NULL, 'Pollo Fresco Con Menudos', 1, 'kg', 'x1'),
('pavita-sadia-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'SADIA', NULL, 'Pavita Sadia X Kg', 1, 'kg', 'x1'),
('tapa-de-asado-novillito', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Tapa De Asado Novillito', 1, 'kg', 'x1'),
('milanesas-de-nalga-union-ganadera', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'UNION GANADERA', NULL, 'Milanesas de Nalga Union Ganadera', 1, 'kg', 'x1'),
('osobuco-novillito', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Osobuco Novillito', 1, 'kg', 'x1'),
('peceto-feteado-para-milanesa', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Peceto Feteado Para Milanesa', 1, 'kg', 'x1'),
('milanesa-de-peceto-rebozada', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'UNION GANADERA', NULL, 'Milanesa De Peceto Rebozada', 1, 'kg', 'x1'),
('matambrito-de-cerdo-fresco-x-kg', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'GRANJA PROPIA', NULL, 'Matambrito De Cerdo Fresco X Kg', 1, 'kg', 'x1'),
('paleta-churrasco-novillito', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA HACIENDA', NULL, 'Paleta Churrasco Novillito', 1, 'kg', 'x1'),
('fideos-municiones-500-grs-matarazzo', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'MATARAZZO', NULL, 'Fideos Municiones 500 Grs Matarazzo', 0.5, 'kg', 'x1'),
('mayonesa-natura-pouch-475-gr', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'NATURA', NULL, 'Mayonesa NATURA Pouch 475 Gr', 0.475, 'kg', 'x1'),
('dulce-de-leche-la-serenisima-colonial-250g', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'LA SERENISIMA', NULL, 'Dulce De Leche La Serenisima Colonial 250g', 0.25, 'kg', 'x1'),
('papas-air-fryer-700-gr-mc-cain', (SELECT id FROM categorias WHERE slug = 'canasta-basica'), 'MC CAIN', NULL, 'Papas Air Fryer 700 Gr Mc Cain', 0.7, 'kg', 'x1'),

-- electro
('heladera-no-frost-inverter-eficiencia-d-299-lts-silver-rt29k577js8-samsung', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'SAMSUNG', NULL, 'Heladera No Frost Inverter Eficiencia D 299 Lts Silver RT29K577JS8 Samsung', 1, 'unidad', 'x1'),
('pochoclera-acero-rojo-pcm6000r-nex', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'NEX', NULL, 'Pochoclera Acero Rojo PCM6000R Nex', 1, 'unidad', 'x1'),
('microondas-rotativo-700-w-negro-94matrb20ubn-20-lts-atma', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'ATMA', NULL, 'Microondas Rotativo 700 W Negro 94matrb20ubn 20 Lts Atma', 1, 'unidad', 'x1'),
('lavarropas-tradicional-6-5-kg-800-rpm-carga-superior-blanco-drean-lsdr0680tb0', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'DREAN', NULL, 'Lavarropas Tradicional 6,5 Kg 800 RPM Carga Superior Blanco Drean LSDR0680TB0', 1, 'unidad', 'x1'),
('aire-acondicionado-inverter-frio-calor-4730-f-5500-w-phin55ha2an-philco', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'PHILCO', NULL, 'Aire Acondicionado Inverter Frio/Calor 4730 F 5500 W PHIN55HA2AN Philco', 1, 'unidad', 'x1'),
('heladera-no-frost-inverter-eficiencia-c-321-lts-gris-rt32k5070s8-samsung', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'SAMSUNG', NULL, 'Heladera No Frost Inverter Eficiencia C 321 Lts Gris RT32K5070S8 Samsung', 1, 'unidad', 'x1'),
('licuadora-2-lts-550-w-roja-lm2701ar-moulinex', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'MOULINEX', NULL, 'Licuadora 2 Lts 550 W Roja LM2701AR Moulinex', 1, 'unidad', 'x1'),
('termotanque-electrico-60-lts-te60-vesubio', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'VESUBIO', NULL, 'Termotanque Electrico 60 Lts Te60 Vesubio', 1, 'unidad', 'x1'),
('batidora-planetaria-1000-w-blanco-smartlife', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'SMARTLIFE', NULL, 'Batidora Planetaria 1000 W Blanco Smartlife', 1, 'unidad', 'x1'),
('smart-tv-65-qled-4k-65t6c-f-tcl', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'TCL', NULL, 'Smart Tv 65" Qled 4K 65T6C-F Tcl', 1, 'unidad', 'x1'),
('heladera-inverter-no-frost-brc330i1a-312-l-bgh', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'BGH', NULL, 'Heladera Inverter No Frost Brc330i1a 312 L Bgh', 1, 'unidad', 'x1'),
('freezer-horizontal-inverter-c-405-lts-blanco-fghi400b-xl-gafa', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'GAFA', NULL, 'Freezer Horizontal Inverter C 405 Lts Blanco FGHI400B-XL Gafa', 1, 'unidad', 'x1'),
('caloventor-electrico-1800-w-05-03-02-01-delf', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'DELF', NULL, 'Caloventor Eléctrico 1800 W 05.03.02.01 Delf', 1, 'unidad', 'x1'),
('tostadora-electrica-800w-gris-acero-inoxidable-tssttr500-oster', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'OSTER', NULL, 'Tostadora Eléctrica 800W Gris Acero Inoxidable Tssttr500 Oster', 1, 'unidad', 'x1'),
('parlante-portatil-bluetooth-5-3-charge-6-jbl', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'JBL', NULL, 'Parlante Portátil Bluetooth 5.3 Charge 6 Jbl', 1, 'unidad', 'x1'),
('sandwichera-ckstsm400-oster', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'OSTER', NULL, 'Sandwichera Ckstsm400 Oster', 1, 'unidad', 'x1'),
('aire-acondicionado-split-frio-calor-4644-f-5400-w-taca-5400fcsd-el4-tcl', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'TCL', NULL, 'Aire Acondicionado Split Frio/Calor 4644 F 5400 W TACA-5400FCSD/EL4 TCL', 1, 'unidad', 'x1'),
('cafetera-espresso-2-un-1240-w-gris-bvstem7201-054-oster', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'OSTER', NULL, 'Cafetera Espresso 2 Un 1240 W Gris BVSTEM7201-054 Oster', 1, 'unidad', 'x1'),
('horno-electrico-bgh-mecanico-duo-55l-c-convecc', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'BGH', NULL, 'Horno Electrico Bgh Mecánico Duo 55l C/convecc', 1, 'unidad', 'x1'),
('tostadora-electrica-2-laminas-digital-0298-nex', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'NEX', NULL, 'Tostadora Eléctrica 2 Láminas Digital 0298 Nex', 1, 'unidad', 'x1'),
('ventilador-pie-20-blanco-eco-axel', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'AXEL', NULL, 'Ventilador Pie 20" Blanco Eco Axel', 1, 'unidad', 'x1'),
('pava-electrica-1-7-lts-blanca-bvstkt4970w-oster', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'OSTER', NULL, 'Pava Eléctrica 1,7 Lts Blanca BVSTKT4970W Oster', 1, 'unidad', 'x1'),
('secarropas-5-5-kg-2800-rpm-negro-n-755-eco-ko-hi-noor', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'KO-HI-NOOR', NULL, 'Secarropas 5,5 Kg 2800 RPM Negro N-755/ECO Ko-Hi-Noor', 1, 'unidad', 'x1'),
('sandwichera-sw14520-nex', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'NEX', NULL, 'Sandwichera Sw14520 Nex', 1, 'unidad', 'x1'),
('licuadora-de-mano-600-w-blanca-91lm8527ap-atma', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'ATMA', NULL, 'Licuadora de Mano 600 W Blanca 91LM8527AP Atma', 1, 'unidad', 'x1'),
('celular-moto-g67-256gb-arctic-seal-motorola', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'MOTOROLA', NULL, 'Celular Moto G67 256GB Arctic Seal Motorola', 1, 'unidad', 'x1'),
('microondas-bgh-28l-q-chef-b228dn26i-grill-negr', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'BGH', NULL, 'Microondas Bgh 28l Q.chef B228dn26i Grill Negr', 1, 'unidad', 'x1'),
('sandwichera-700-w-gris-esg20-electrolux', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'ELECTROLUX', NULL, 'Sandwichera 700 W Gris ESG20 Electrolux', 1, 'unidad', 'x1'),
('ventilador-dee-pie-v-20p-pala-metal-1-nex', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'NEX', NULL, 'Ventilador Dee Pie V-20p Pala Metal 1 Nex', 1, 'unidad', 'x1'),
('mouse-inalambrico-logitech-m170-blanco', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'LOGITECH', NULL, 'Mouse Inalámbrico Logitech M170 Blanco', 1, 'unidad', 'x1'),
('cafetera-1-4-lts-blanca-bvstem6801m-054-oster', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'OSTER', NULL, 'Cafetera 1,4 Lts Blanca BVSTEM6801M-054 Oster', 1, 'unidad', 'x1'),
('hervidor-electrico-1-7-lts-negro-kp1765-nex', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'NEX', NULL, 'Hervidor Eléctrico 1,7 Lts Negro KP1765 Nex', 1, 'unidad', 'x1'),
('ventilador-turboventilador-12-35-w-3-velocidades-verde-deco-iv-12-indelplas', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'INDELPLAS', NULL, 'Ventilador Turboventilador 12" 35 W 3 Velocidades Verde DECO IV 12 Indelplas', 1, 'unidad', 'x1'),
('aire-acondicionado-split-inverter-10550-w-phin105hc2an-philco', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'PHILCO', NULL, 'Aire Acondicionado Split Inverter 10550 W Phin105hc2an Philco', 1, 'unidad', 'x1'),
('aire-acondicionado-frio-calor-inverter-32612-f-4200-w-s3-w120a1da-lg', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'LG', NULL, 'Aire Acondicionado Frío/Calor Inverter 32612 F 4200 W S3-W120A1DA LG', 1, 'unidad', 'x1'),
('soporte-para-celular-articulado-con-succion-goodyear-iael', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'IAEL', NULL, 'Soporte para Celular Articulado con Succión Goodyear Iael', 1, 'unidad', 'x1'),
('ventilador-de-techo-48-85-w-3-velocidades-negro-3418r-protalia', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'PROTALIA', NULL, 'Ventilador de Techo 48" 85 W 3 Velocidades Negro 3418R Protalia', 1, 'unidad', 'x1'),
('freidora-aire-5-5-l-5024-nex', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'NEX', NULL, 'Freidora Aire 5,5 L 5024 Nex', 1, 'unidad', 'x1'),
('licuadora-profesional-xtreme-mix-1500-w-oster', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'OSTER', NULL, 'Licuadora Profesional Xtreme Mix 1500 W Oster', 1, 'unidad', 'x1'),
('ventilador-turbo-20-70-w-3-velocidades-blanco-axtur20-blanco-axel', (SELECT id FROM categorias WHERE slug = 'bienes-durables'), 'AXEL', NULL, 'Ventilador Turbo 20" 70 W 3 Velocidades Blanco AXTUR20 BLANCO Axel', 1, 'unidad', 'x1')
    
ON CONFLICT (slug) DO UPDATE SET
	nombre_normalizado = EXCLUDED.nombre_normalizado,
	contenido_neto_valor = EXCLUDED.contenido_neto_valor,
	contenido_neto_unidad = EXCLUDED.contenido_neto_unidad,
	pack = EXCLUDED.pack, -- Esto fue agregado para asegurar que los cambios en el pack se reflejen correctamente
	updated_at = NOW();   -- verificá el nombre real de la columna

INSERT INTO alias_tienda (
	producto_canonico_id,
	tienda_id,
	alias_producto,
	sku_tienda,
	url_origen,
	metodo_matching
) VALUES
-- canasta basica - coto
((SELECT id FROM productos_canonicos WHERE slug = 'picada-especial-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Picada Especial X KG', '2069607000002', 'https://www.coto.com.ar/productos/picada-especial-x-kg-/_/R-00069607-00069607-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'asado-del-medio-estancias-coto-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Asado Del Medio Estancias Coto X KG', '2000000479798', 'https://www.coto.com.ar/productos/asado-del-medio-estancias-coto-x-kg-/_/R-00047979-00047979-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'nalga-estancias-coto-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Nalga Estancias Coto X KG', '2000000479910', 'https://www.coto.com.ar/productos/nalga-estancias-coto-x-kg-/_/R-00047991-00047991-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'cuadrada-novillito-estancias-coto-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Cuadrada Novillito Estancias Coto X Kg', '2029905000005', 'https://www.coto.com.ar/productos/cuadrada-novillito-estancias-coto-x-kg-/_/R-00029905-00029905-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'cuadril-selección-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Cuadril Selección X KG', '2004231700003', 'https://www.coto.com.ar/productos/cuadril-seleccion-x-kg-/_/R-00042317-00042317-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'picada-desgrasada-estancias-coto-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Picada Desgrasada Estancias Coto X KG', '2000000481241', 'https://www.coto.com.ar/productos/picada-desgrasada-estancias-coto-x-kg-/_/R-00048124-00048124-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'bondiola-de-cerdo-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Bondiola De Cerdo X KG', '2000943000004', 'https://www.coto.com.ar/productos/bondiola-de-cerdo-x-kg-/_/R-00000943-00000943-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'roast-beef-estancias-coto-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Roast Beef Estancias Coto X KG', '2000000479859', 'https://www.coto.com.ar/productos/roast-beef-estancias-coto-x-kg-/_/R-00047985-00047985-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'bola-de-lomo-estancias-coto-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Bola De Lomo Estancias Coto X KG', '2000000479934', 'https://www.coto.com.ar/productos/bola-de-lomo-estancias-coto-x-kg-/_/R-00047993-00047993-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'carré-de-cerdo-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Carré De Cerdo X KG', '2017162000005', 'https://www.coto.com.ar/productos/carre-de-cerdo-x-kg-/_/R-00017162-00017162-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'chuleta-de-paleta-de-cerdo-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Chuleta De Paleta De Cerdo X KG', '2017700000009', 'https://www.coto.com.ar/productos/chuleta-de-paleta-de-cerdo-x-kg-/_/R-00017700-00017700-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'tapa-de-asado-especial-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Tapa De Asado Especial X KG', '2000000478616', 'https://www.coto.com.ar/productos/tapa-de-asado-especial-x-kg-/_/R-00047861-00047861-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'pechito-con-manta-de-cerdo-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Pechito Con Manta De Cerdo X KG', '2017410000009', 'https://www.coto.com.ar/productos/pechito-con-manta-de-cerdo-x-kg-/_/R-00017410-00017410-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'vacío-del-centro-estancias-coto-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Vacío Del Centro Estancias Coto X KG', '2000000479804', 'https://www.coto.com.ar/productos/vacio-del-centro-estancias-coto-x-kg-/_/R-00047980-00047980-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'tapa-de-nalga-estancias-coto-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Tapa De Nalga Estancias Coto X KG', '2000000481289', 'https://www.coto.com.ar/productos/tapa-de-nalga-estancias-coto-x-kg-/_/R-00048128-00048128-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'chuleta-de-jamón-de-cerdo-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Chuleta De Jamón De Cerdo X KG', '2017414000005', 'https://www.coto.com.ar/productos/chuleta-de-jamon-de-cerdo-x-kg-/_/R-00017414-00017414-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'osobuco-de-garron-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Osobuco De Garron X KG', '2004146300008', 'https://www.coto.com.ar/productos/osobuco-de-garron-x-kg-/_/R-00041463-00041463-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'picada-de-cerdo-x-kg'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Picada De Cerdo X KG', '2017701000008', 'https://www.coto.com.ar/productos/picada-de-cerdo-x-kg-/_/R-00017701-00017701-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'fideos-municiones-500-grs-matarazzo'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Fideos Spaghetti MATARAZZO 500g', '7790070336309', 'https://www.coto.com.ar/productos/fideos-spaghetti-matarazzo-500g-/_/R-00573911-00573911-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'mayonesa-natura-pouch-475-gr'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Mayonesa NATURA Pouch 475 Gr', '7791866001364', 'https://www.coto.com.ar/productos/mayonesa-natura-pouch-475-gr-/_/R-00075721-00075721-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'dulce-de-leche-la-serenisima-colonial-250g'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'DULCE DE LECHE LS ESTILO COLONIAL POTE 250GR', '7790742625106', 'https://www.coto.com.ar/productos/dulce-de-leche-ls-estilo-colonial-pote-250gr/_/R-00510305-00510305-200', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'papas-air-fryer-700-gr-mc-cain'), (SELECT id FROM tiendas WHERE slug = 'coto'), 'Papas Air Fryer + Finitas MCCAIN 700g', '7797906055014', 'https://www.coto.com.ar/productos/papas-air-fryer-%2B-finitas-mccain-700g/_/R-00599976-00599976-200', 'MANUAL_SEED'),
-- canasta basica - jumbo
((SELECT id FROM productos_canonicos WHERE slug = 'suprema-de-pollo-granel-fresca'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Suprema De Pollo Granel Fresca', '22460226001', 'https://www.jumbo.com.ar/suprema-de-pollo-granel-fresca/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'picada-especial'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Picada Especial', '22140125001', 'https://www.jumbo.com.ar/picada-especial/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'cuarto-trasero-de-pollo-granel-fresco'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Cuarto Trasero De Pollo Granel Fresco', '22460201001', 'https://www.jumbo.com.ar/cuarto-trasero-de-pollo-granel-fresco-4/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'roast-beef-churrasco-novillito'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Roast Beef Churrasco Novillito', '22140415001', 'https://www.jumbo.com.ar/roast-beef-churrasco-novillito/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'carré-de-cerdo-deshuesado-congelado'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Carré De Cerdo Deshuesado Congelado', '22210211001', 'https://www.jumbo.com.ar/carre-de-cerdo-deshuesado-congelado/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'colita-de-cuadril-novillito'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Colita De Cuadril Novillito', '22140490001', 'https://www.jumbo.com.ar/colita-de-cuadril-novillito/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'tapa-de-nalga-novillito'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Tapa De Nalga Novillito', '22140407001', 'https://www.jumbo.com.ar/tapa-de-nalga-novillito/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'bife-angosto-la-hacienda'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Bife Angosto La Hacienda', '22140122001', 'https://www.jumbo.com.ar/bife-angosto-la-hacienda/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'milanesa-nalga-novillito'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Milanesa Nalga Novillito', '22140406001', 'https://www.jumbo.com.ar/milanesa-nalga-novillito/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'bondiola-de-cerdo-fresca-x-kg'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Bondiola De Cerdo Fresca X Kg', '22210110002', 'https://www.jumbo.com.ar/bondiola-de-cerdo-fresca-x-kg-2-2/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'bondiola-de-cerdo-congelada'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Bondiola De Cerdo Congelada', '22210212001', 'https://www.jumbo.com.ar/bondiola-de-cerdo-congelada/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'pollo-fresco-con-menudos'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Pollo Fresco Con Menudos', '22440106001', 'https://www.jumbo.com.ar/pollo-fresco-con-menudos-3/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'pavita-sadia-x-kg'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Pavita Sadia X Kg', '22420107001', 'https://www.jumbo.com.ar/pavita-sadia-x-kg/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'tapa-de-asado-novillito'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Tapa De Asado Novillito', '22140413001', 'https://www.jumbo.com.ar/tapa-de-asado-novillito/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'milanesas-de-nalga-union-ganadera'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Milanesas de Nalga Union Ganadera', '22820102003', 'https://www.jumbo.com.ar/milanesa-de-nalga-rebozada-2/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'osobuco-novillito'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Osobuco Novillito', '22140481001', 'https://www.jumbo.com.ar/osobuco-novillito/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'peceto-feteado-para-milanesa'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Peceto Feteado Para Milanesa', '22140126001', 'https://www.jumbo.com.ar/peceto-feteado-para-milanesa/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'milanesa-de-peceto-rebozada'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Milanesa De Peceto Rebozada', '22820101005', 'https://www.jumbo.com.ar/milanesa-de-peceto-rebozada/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'matambrito-de-cerdo-fresco-x-kg'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Matambrito De Cerdo Fresco X Kg', '22210111002', 'https://www.jumbo.com.ar/matambrito-de-cerdo-fresco-x-kg-3/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'paleta-churrasco-novillito'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Paleta Churrasco Novillito', '22140414001', 'https://www.jumbo.com.ar/paleta-churrasco-novillito/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'fideos-municiones-500-grs-matarazzo'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Fideos Municiones 500 Grs Matarazzo', '11461901027', 'https://www.jumbo.com.ar/fideos-municiones-matarazzo-x500-gr-2/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'mayonesa-natura-pouch-475-gr'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Mayonesa Clásica 475 Grs Natura', '11510117007', 'https://www.jumbo.com.ar/aderezo-mayonesa-475-gr-natura/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'dulce-de-leche-la-serenisima-colonial-250g'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Dulce De Leche La Serenisima Colonial 250g', '21280104026', 'https://www.jumbo.com.ar/dulce-de-leche-la-serenisima-colonial-250g/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'papas-air-fryer-700-gr-mc-cain'), (SELECT id FROM tiendas WHERE slug = 'jumbo'), 'Papas Air Fryer 700 Gr Mc Cain', '21430525002', 'https://www.jumbo.com.ar/papas-air-fryer-700-gr-mc-cain/p', 'MANUAL_SEED'),

-- electro - vea
((SELECT id FROM productos_canonicos WHERE slug = 'heladera-no-frost-inverter-eficiencia-d-299-lts-silver-rt29k577js8-samsung'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Heladera No Frost Inverter Eficiencia D 299 Lts Silver RT29K577JS8 Samsung', '61210133024', 'https://www.vea.com.ar/heladera-con-freezer-rt29k577js8-299-l-silver-samsung/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'pochoclera-acero-rojo-pcm6000r-nex'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Pochoclera Acero Rojo PCM6000R Nex', '61330507001', 'https://www.vea.com.ar/pochoclera-pcm6000r-nex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'aire-acondicionado-inverter-frio-calor-4730-f-5500-w-phin55ha2an-philco'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Aire Acondicionado Inverter Frio/Calor 4730 F 5500 W PHIN55HA2AN Philco', '61260140027', 'https://www.vea.com.ar/aire-acondicionado-philco-5500-w-phin55ha2an/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'freidora-aire-5-5-l-5024-nex'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Freidora Aire 5,5 L 5024 Nex', '61330148006', 'https://www.vea.com.ar/freidora-aire-5-5-l-5024-nex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'licuadora-2-lts-550-w-roja-lm2701ar-moulinex'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Licuadora 2 Lts 550 W Roja LM2701AR Moulinex', '61320522019', 'https://www.vea.com.ar/licuadora-optimix-roja-lm2701ar-moulinex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'microondas-rotativo-700-w-negro-94matrb20ubn-20-lts-atma'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Microondas Rotativo 700 W Negro 94matrb20ubn 20 Lts Atma', '61240718047', 'https://www.vea.com.ar/microondas-rotativo-700-w-negro-94matrb20ubn-20-lts-atma/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'termotanque-electrico-60-lts-te60-vesubio'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Termotanque Electrico 60 Lts Te60 Vesubio', '61230326002', 'https://www.vea.com.ar/termotanque-electrico-60-lts-te60-vesubio/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'parlante-portatil-bluetooth-5-3-charge-6-jbl'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Parlante Portátil Bluetooth 5.3 Charge 6 Jbl', '61111203029', 'https://www.vea.com.ar/parlante-portatil-charge-6-negro-jbl/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'batidora-planetaria-1000-w-blanco-smartlife'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Batidora Planetaria 1000 W Blanco Smartlife', '61320340003', 'https://www.vea.com.ar/batidora-planetaria-smartlife-1000w/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'smart-tv-65-qled-4k-65t6c-f-tcl'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Smart Tv 65" Qled 4K 65T6C-F Tcl', '61112866039', 'https://www.vea.com.ar/smart-tv-65-qled-65t6c-uhd-google-tv-rv-tcl/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'pava-electrica-1-7-lts-blanca-bvstkt4970w-oster'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Pava Eléctrica 1,7 Lts Blanca BVSTKT4970W Oster', '61340224006', 'https://www.vea.com.ar/pava-electrica-1-7l-bnc-bvstkt4970w-oster-2/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'hervidor-electrico-1-7-lts-negro-kp1765-nex'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Hervidor Eléctrico 1,7 Lts Negro KP1765 Nex', '61340223006', 'https://www.vea.com.ar/hervidor-plastico-kp1765-1-7-l-nex-2/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'licuadora-profesional-xtreme-mix-1500-w-oster'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Licuadora Profesional Xtreme Mix 1500 W Oster', '61320529015', 'https://www.vea.com.ar/licuadora-profesional-xtreme-mix-1500-w-oster/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'horno-electrico-bgh-mecanico-duo-55l-c-convecc'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Horno Electrico Bgh Mecánico Duo 55l C/convecc', '61330810035', 'https://www.vea.com.ar/horno-electrico-bgh-mecanico-duo-55l-c-convecc-2/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'celular-moto-g67-256gb-arctic-seal-motorola'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Celular Moto G67 256GB Arctic Seal Motorola', '61160524323', 'https://www.vea.com.ar/celular-moto-g67-arctic-seal-4-56-gb-motorola/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'cafetera-espresso-2-un-1240-w-gris-bvstem7201-054-oster'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Cafetera Espresso 2 Un 1240 W Gris BVSTEM7201-054 Oster', '61340117038', 'https://www.vea.com.ar/cafetera-oster-espresso-perfect-brew-compact-1/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'secarropas-5-5-kg-2800-rpm-negro-n-755-eco-ko-hi-noor'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Secarropas 5,5 Kg 2800 RPM Negro N-755/ECO Ko-Hi-Noor', '61220312030', 'https://www.vea.com.ar/secarropas-centrifugo-n-755-eco-5-5-kg-negro-ko-hi-noor/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'tostadora-electrica-2-laminas-digital-0298-nex'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Tostadora Eléctrica 2 Láminas Digital 0298 Nex', '61330350011', 'https://www.vea.com.ar/tostadora-2-laminas-panel-digital-0298-nex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'heladera-inverter-no-frost-brc330i1a-312-l-bgh'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Heladera Inverter No Frost Brc330i1a 312 L Bgh', '61210157005', 'https://www.vea.com.ar/heladera-inverter-no-frost-brc330i1a-312-l-bgh/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'aire-acondicionado-split-frio-calor-4644-f-5400-w-taca-5400fcsd-el4-tcl'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Aire Acondicionado Split Frio/Calor 4644 F 5400 W TACA-5400FCSD/EL4 TCL', '61260168004', 'https://www.vea.com.ar/aire-acondicionado-tcl-fc-taca-5400-elite-5400/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'sandwichera-ckstsm400-oster'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Sandwichera Ckstsm400 Oster', '61330417005', 'https://www.vea.com.ar/sandwichera-ckstsm400-oster/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'tostadora-electrica-800w-gris-acero-inoxidable-tssttr500-oster'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Tostadora Eléctrica 800W Gris Acero Inoxidable Tssttr500 Oster', '61330321008', 'https://www.vea.com.ar/tostadora-electrica-800w-gris-acero-inoxidable-tssttr500-oster/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'ventilador-turboventilador-12-35-w-3-velocidades-verde-deco-iv-12-indelplas'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Ventilador Turboventilador 12" 35 W 3 Velocidades Verde DECO IV 12 Indelplas', '61260351006', 'https://www.vea.com.ar/turboventilador-deco-iv-d12-verde-indelplas/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'sandwichera-sw14520-nex'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Sandwichera Sw14520 Nex', '61330416007', 'https://www.vea.com.ar/sandwichera-sw14520-nex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'licuadora-de-mano-600-w-blanca-91lm8527ap-atma'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Licuadora de Mano 600 W Blanca 91LM8527AP Atma', '61320505021', 'https://www.vea.com.ar/licuadora-de-mano-600w-atma/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'ventilador-dee-pie-v-20p-pala-metal-1-nex'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Ventilador Dee Pie V-20p Pala Metal 1 Nex', '61260336013', 'https://www.vea.com.ar/ventilador-dee-pie-v-20p-pala-metal-1-nex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'sandwichera-700-w-gris-esg20-electrolux'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Sandwichera 700 W Gris ESG20 Electrolux', '61330407002', 'https://www.vea.com.ar/sandwichera-700-w-gris-esg20-electrolux/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'soporte-para-celular-articulado-con-succion-goodyear-iael'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Soporte para Celular Articulado con Succión Goodyear Iael', '61160782007', 'https://www.vea.com.ar/porta-telefono-goodyear-articulado-succion-iael/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'ventilador-de-techo-48-85-w-3-velocidades-negro-3418r-protalia'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Ventilador de Techo 48" 85 W 3 Velocidades Negro 3418R Protalia', '61260909004', 'https://www.vea.com.ar/ventilador-de-techo-48-protalia-3418-rem-negro/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'mouse-inalambrico-logitech-m170-blanco'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Mouse Inalámbrico Logitech M170 Blanco', '61131804026', 'https://www.vea.com.ar/mouse-logitech-wir-m170-white-blister-910-0068/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'aire-acondicionado-split-inverter-10550-w-phin105hc2an-philco'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Aire Acondicionado Split Inverter 10550 W Phin105hc2an Philco', '61260140028', 'https://www.vea.com.ar/aire-acondicionado-split-inverter-10550-w-phin105hc2an-philco/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'microondas-bgh-28l-q-chef-b228dn26i-grill-negr'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Microondas Bgh 28l Q.chef B228dn26i Grill Negr', '61240710042', 'https://www.vea.com.ar/microondas-bgh-28l-q-chef-b228dn26i-grill-negr/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'ventilador-turbo-20-70-w-3-velocidades-blanco-axtur20-blanco-axel'), (SELECT id FROM tiendas WHERE slug = 'vea'), 'Ventilador Turbo 20" 70 W 3 Velocidades Blanco AXTUR20 BLANCO Axel', '61260314004', 'https://www.vea.com.ar/ventilador-turbo-20-blanco-axpie20ble-axel/p', 'MANUAL_SEED'),

-- electro - disco
((SELECT id FROM productos_canonicos WHERE slug = 'heladera-no-frost-inverter-eficiencia-d-299-lts-silver-rt29k577js8-samsung'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Heladera No Frost Inverter Eficiencia D 299 Lts Silver RT29K577JS8 Samsung', '61210133024', 'https://www.disco.com.ar/heladera-con-freezer-rt29k577js8-299-l-silver-samsung/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'pochoclera-acero-rojo-pcm6000r-nex'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Pochoclera Acero Rojo PCM6000R Nex', '61330507001', 'https://www.disco.com.ar/pochoclera-pcm6000r-nex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'microondas-rotativo-700-w-negro-94matrb20ubn-20-lts-atma'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Microondas Rotativo 700 W Negro 94matrb20ubn 20 Lts Atma', '61240718047', 'https://www.disco.com.ar/microondas-rotativo-700-w-negro-94matrb20ubn-20-lts-atma/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'lavarropas-tradicional-6-5-kg-800-rpm-carga-superior-blanco-drean-lsdr0680tb0'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Lavarropas Tradicional 6,5 Kg 800 RPM Carga Superior Blanco Drean LSDR0680TB0', '61220905034', 'https://www.disco.com.ar/lavarropas-tradicional-6-5-kg-800-rpm-carga-superior-blanco-lsdr0680tb0-drean/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'aire-acondicionado-inverter-frio-calor-4730-f-5500-w-phin55ha2an-philco'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Aire Acondicionado Inverter Frio/Calor 4730 F 5500 W PHIN55HA2AN Philco', '61260140027', 'https://www.disco.com.ar/aire-acondicionado-philco-5500-w-phin55ha2an/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'heladera-no-frost-inverter-eficiencia-c-321-lts-gris-rt32k5070s8-samsung'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Heladera No Frost Inverter Eficiencia C 321 Lts Gris RT32K5070S8 Samsung', '61210133021', 'https://www.disco.com.ar/heladera-no-frost-321-l-inverter-acero-inoxidable-samsung/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'licuadora-2-lts-550-w-roja-lm2701ar-moulinex'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Licuadora 2 Lts 550 W Roja LM2701AR Moulinex', '61320522019', 'https://www.disco.com.ar/licuadora-optimix-roja-lm2701ar-moulinex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'termotanque-electrico-60-lts-te60-vesubio'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Termotanque Electrico 60 Lts Te60 Vesubio', '61230326002', 'https://www.disco.com.ar/termotanque-electrico-60-lts-te60-vesubio/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'batidora-planetaria-1000-w-blanco-smartlife'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Batidora Planetaria 1000 W Blanco Smartlife', '61320340003', 'https://www.disco.com.ar/batidora-planetaria-smartlife-1000w/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'smart-tv-65-qled-4k-65t6c-f-tcl'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Smart Tv 65" Qled 4K 65T6C-F Tcl', '61112866039', 'https://www.disco.com.ar/smart-tv-65-qled-65t6c-uhd-google-tv-rv-tcl/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'heladera-inverter-no-frost-brc330i1a-312-l-bgh'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Heladera Inverter No Frost Brc330i1a 312 L Bgh', '61210157005', 'https://www.disco.com.ar/heladera-inverter-no-frost-brc330i1a-312-l-bgh/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'freezer-horizontal-inverter-c-405-lts-blanco-fghi400b-xl-gafa'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Freezer Horizontal Inverter C 405 Lts Blanco FGHI400B-XL Gafa', '61210501028', 'https://www.disco.com.ar/freezer-gafa-fghi400b-xl-inverter-blanco-402-l/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'caloventor-electrico-1800-w-05-03-02-01-delf'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Caloventor Eléctrico 1800 W 05.03.02.01 Delf', '61260695001', 'https://www.disco.com.ar/caloventor-electrico-1800-w-delf/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'tostadora-electrica-800w-gris-acero-inoxidable-tssttr500-oster'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Tostadora Eléctrica 800W Gris Acero Inoxidable Tssttr500 Oster', '61330321008', 'https://www.disco.com.ar/tostadora-electrica-800w-gris-acero-inoxidable-tssttr500-oster/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'parlante-portatil-bluetooth-5-3-charge-6-jbl'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Parlante Portátil Bluetooth 5.3 Charge 6 Jbl', '61111203029', 'https://www.disco.com.ar/parlante-portatil-charge-6-negro-jbl/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'sandwichera-ckstsm400-oster'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Sandwichera Ckstsm400 Oster', '61330417005', 'https://www.disco.com.ar/sandwichera-ckstsm400-oster/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'aire-acondicionado-split-frio-calor-4644-f-5400-w-taca-5400fcsd-el4-tcl'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Aire Acondicionado Split Frio/Calor 4644 F 5400 W TACA-5400FCSD/EL4 TCL', '61260168004', 'https://www.disco.com.ar/aire-acondicionado-tcl-fc-taca-5400-elite-5400/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'cafetera-espresso-2-un-1240-w-gris-bvstem7201-054-oster'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Cafetera Espresso 2 Un 1240 W Gris BVSTEM7201-054 Oster', '61340117038', 'https://www.disco.com.ar/cafetera-oster-espresso-perfect-brew-compact-1/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'horno-electrico-bgh-mecanico-duo-55l-c-convecc'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Horno Electrico Bgh Mecánico Duo 55l C/convecc', '61330810035', 'https://www.disco.com.ar/horno-electrico-bgh-mecanico-duo-55l-c-convecc-2/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'tostadora-electrica-2-laminas-digital-0298-nex'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Tostadora Eléctrica 2 Láminas Digital 0298 Nex', '61330350011', 'https://www.disco.com.ar/tostadora-2-laminas-panel-digital-0298-nex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'ventilador-pie-20-blanco-eco-axel'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Ventilador Pie 20" Blanco Eco Axel', '61260312005', 'https://www.disco.com.ar/ventilador-pie-20-blanco-eco-axel/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'pava-electrica-1-7-lts-blanca-bvstkt4970w-oster'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Pava Eléctrica 1,7 Lts Blanca BVSTKT4970W Oster', '61340224006', 'https://www.disco.com.ar/pava-electrica-1-7l-bnc-bvstkt4970w-oster-2/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'secarropas-5-5-kg-2800-rpm-negro-n-755-eco-ko-hi-noor'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Secarropas 5,5 Kg 2800 RPM Negro N-755/ECO Ko-Hi-Noor', '61220312030', 'https://www.disco.com.ar/secarropas-centrifugo-n-755-eco-5-5-kg-negro-ko-hi-noor/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'sandwichera-sw14520-nex'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Sandwichera Sw14520 Nex', '61330416007', 'https://www.disco.com.ar/sandwichera-sw14520-nex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'licuadora-de-mano-600-w-blanca-91lm8527ap-atma'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Licuadora de Mano 600 W Blanca 91LM8527AP Atma', '61320505021', 'https://www.disco.com.ar/licuadora-de-mano-600w-atma/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'celular-moto-g67-256gb-arctic-seal-motorola'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Celular Moto G67 256GB Arctic Seal Motorola', '61160524323', 'https://www.disco.com.ar/celular-moto-g67-arctic-seal-4-56-gb-motorola/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'microondas-bgh-28l-q-chef-b228dn26i-grill-negr'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Microondas Bgh 28l Q.chef B228dn26i Grill Negr', '61240710042', 'https://www.disco.com.ar/microondas-bgh-28l-q-chef-b228dn26i-grill-negr/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'sandwichera-700-w-gris-esg20-electrolux'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Sandwichera 700 W Gris ESG20 Electrolux', '61330407002', 'https://www.disco.com.ar/sandwichera-700-w-gris-esg20-electrolux/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'ventilador-dee-pie-v-20p-pala-metal-1-nex'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Ventilador Dee Pie V-20p Pala Metal 1 Nex', '61260336013', 'https://www.disco.com.ar/ventilador-dee-pie-v-20p-pala-metal-1-nex/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'mouse-inalambrico-logitech-m170-blanco'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Mouse Inalámbrico Logitech M170 Blanco', '61131804026', 'https://www.disco.com.ar/mouse-logitech-wir-m170-white-blister-910-0068/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'cafetera-1-4-lts-blanca-bvstem6801m-054-oster'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Cafetera 1,4 Lts Blanca BVSTEM6801M-054 Oster', '61340117026', 'https://www.disco.com.ar/cafetera-primalatte-touch-oster/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'hervidor-electrico-1-7-lts-negro-kp1765-nex'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Hervidor Eléctrico 1,7 Lts Negro KP1765 Nex', '61340223006', 'https://www.disco.com.ar/hervidor-plastico-kp1765-1-7-l-nex-2/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'ventilador-turboventilador-12-35-w-3-velocidades-verde-deco-iv-12-indelplas'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Ventilador Turboventilador 12" 35 W 3 Velocidades Verde DECO IV 12 Indelplas', '61260351006', 'https://www.disco.com.ar/turboventilador-deco-iv-d12-verde-indelplas/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'aire-acondicionado-split-inverter-10550-w-phin105hc2an-philco'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Aire Acondicionado Split Inverter 10550 W Phin105hc2an Philco', '61260140028', 'https://www.disco.com.ar/aire-acondicionado-split-inverter-10550-w-phin105hc2an-philco/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'aire-acondicionado-frio-calor-inverter-32612-f-4200-w-s3-w120a1da-lg'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Aire Acondicionado Frío/Calor Inverter 32612 F 4200 W S3-W120A1DA LG', '61260113049', 'https://www.disco.com.ar/aire-acondicionado-split-lg-s3-w120a1da-3612fg/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'soporte-para-celular-articulado-con-succion-goodyear-iael'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Soporte para Celular Articulado con Succión Goodyear Iael', '61160782007', 'https://www.disco.com.ar/porta-telefono-goodyear-articulado-succion-iael/p', 'MANUAL_SEED'),
((SELECT id FROM productos_canonicos WHERE slug = 'ventilador-de-techo-48-85-w-3-velocidades-negro-3418r-protalia'), (SELECT id FROM tiendas WHERE slug = 'disco'), 'Ventilador de Techo 48" 85 W 3 Velocidades Negro 3418R Protalia', '61260909004', 'https://www.disco.com.ar/ventilador-de-techo-48-protalia-3418-rem-negro/p', 'MANUAL_SEED')

 ON CONFLICT (tienda_id, url_origen) DO UPDATE SET 
    alias_producto = EXCLUDED.alias_producto,
    sku_tienda = EXCLUDED.sku_tienda;
SELECT * from observaciones_precios
