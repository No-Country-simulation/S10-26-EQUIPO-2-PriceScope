-- ============================================================================
-- 00. CONFIGURACIÓN INICIAL Y EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- ============================================================================
-- 01. CREACIÓN DE ENUMS (DDL Directo sin bloques DO)
-- ============================================================================
DROP TYPE IF EXISTS enum_tipo_tienda CASCADE;
CREATE TYPE enum_tipo_tienda AS ENUM ('supermercado', 'electro');

DROP TYPE IF EXISTS enum_unidad_medida CASCADE;
CREATE TYPE enum_unidad_medida AS ENUM ('kg', 'L', 'unidad');

DROP TYPE IF EXISTS enum_estado_dato CASCADE;
CREATE TYPE enum_estado_dato AS ENUM ('DATO_VALIDO', 'AGOTADO', 'ERROR_CAPTURA', 'SIN_DATO');

DROP TYPE IF EXISTS enum_tipo_cambio CASCADE;
CREATE TYPE enum_tipo_cambio AS ENUM ('oficial', 'parallel', 'mep', 'ccl');

DROP TYPE IF EXISTS enum_condicion_cambio CASCADE;
CREATE TYPE enum_condicion_cambio AS ENUM ('venta', 'compra');

DROP TYPE IF EXISTS enum_tipo_hito CASCADE;
CREATE TYPE enum_tipo_hito AS ENUM ('AUTOMATICO', 'MANUAL');

DROP TYPE IF EXISTS enum_estado_corrida CASCADE;
CREATE TYPE enum_estado_corrida AS ENUM ('PENDIENTE', 'EN_PROCESO', 'EXITOSA', 'ADVERTENCIA', 'FALLIDA', 'ABORTADA');

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
    p_tipo_cambio enum_tipo_cambio DEFAULT 'parallel'::enum_tipo_cambio,
    p_condicion enum_condicion_cambio DEFAULT 'venta'::enum_condicion_cambio,
    p_fuente VARCHAR DEFAULT NULL
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
      AND c.condicion = p_condicion
      AND (p_fuente IS NULL OR c.fuente = p_fuente)
      AND c.timestamp_utc <= v_cierre_local_utc
      AND c.timestamp_utc >= v_limite_ttl_utc
    ORDER BY c.timestamp_utc DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::NUMERIC(12,4), FALSE, NULL::VARCHAR(50), 'SIN_DATO'::VARCHAR(20);
    END IF;
END;

$$ LANGUAGE plpgsql STABLE;
