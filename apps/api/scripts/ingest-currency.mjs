import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Pool } = require('pg');

const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares';
const TIPO_POR_CASA = { oficial: 'oficial', blue: 'parallel' };
const ZONA_MERCADO = 'America/Argentina/Buenos_Aires';

async function fetchCotizaciones() {
  const res = await fetch(DOLAR_API_URL, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    throw new Error(`DolarAPI respondió HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('DolarAPI devolvió un formato inesperado');
  }
  return data;
}

function buildRows(cotizaciones) {
  const rows = [];
  for (const cot of cotizaciones) {
    const tipo = TIPO_POR_CASA[cot.casa];
    if (!tipo) continue;
    for (const condicion of ['venta', 'compra']) {
      const valor = cot[condicion];
      if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) continue;
      rows.push({
        timestamp_utc: cot.fechaActualizacion,
        moneda_base: 'USD',
        moneda_cotizada: 'ARS',
        tipo,
        condicion,
        valor,
        fuente: 'DolarAPI',
      });
    }
  }
  return rows;
}

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('Falta la variable de entorno DATABASE_URL');
  }

  const cotizaciones = await fetchCotizaciones();
  const rows = buildRows(cotizaciones);
  if (rows.length === 0) {
    console.log('Sin cotizaciones válidas para insertar.');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    let inserted = 0;
    for (const r of rows) {
      const res = await pool.query(
        `INSERT INTO cotizaciones_divisas (
          timestamp_utc, moneda_base, moneda_cotizada, tipo, condicion, valor, fuente, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT DO NOTHING
        RETURNING timestamp_utc;`,
        [r.timestamp_utc, r.moneda_base, r.moneda_cotizada, r.tipo, r.condicion, r.valor, r.fuente],
      );
      if (res.rowCount > 0) inserted++;
    }

    const diasPendientes = await pool.query(
      `SELECT DISTINCT to_char(timestamp_utc AT TIME ZONE $1, 'YYYY-MM-DD') AS dia
       FROM observaciones_precios
       WHERE estado_dato = 'DATO_VALIDO'
         AND cotizacion_aplicada IS NULL
         AND timestamp_utc >= NOW() - INTERVAL '7 days'
         AND (timestamp_utc AT TIME ZONE $1)::date <= (NOW() AT TIME ZONE $1)::date
       ORDER BY dia;`,
      [ZONA_MERCADO],
    );

    let updatedObs = 0;
    for (const { dia } of diasPendientes.rows) {
      const cierreRes = await pool.query(
        `SELECT cotizacion_aplicada, cotizacion_aproximada, fuente_cotizacion, estado_sincronizacion
         FROM fn_obtener_cotizacion_cierre($1::timestamptz, 'parallel'::enum_tipo_cambio);`,
        [`${dia}T12:00:00-03:00`],
      );
      const cierre = cierreRes.rows[0];
      if (!cierre || cierre.estado_sincronizacion === 'SIN_DATO' || cierre.cotizacion_aplicada === null) {
        continue;
      }

      const upd = await pool.query(
        `UPDATE observaciones_precios
         SET cotizacion_aplicada = $1,
             cotizacion_aproximada = $2,
             fuente_cotizacion = $3
         WHERE estado_dato = 'DATO_VALIDO'
           AND cotizacion_aplicada IS NULL
           AND timestamp_utc >= ($5::date::timestamp AT TIME ZONE $4)
           AND timestamp_utc < (($5::date + 1)::timestamp AT TIME ZONE $4);`,
        [cierre.cotizacion_aplicada, cierre.cotizacion_aproximada, cierre.fuente_cotizacion, ZONA_MERCADO, dia],
      );
      updatedObs += upd.rowCount ?? 0;
    }

    console.log(
      `Ingesta completada: ${inserted} nuevas cotizaciones (${rows.length} procesadas), ${updatedObs} observaciones actualizadas.`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error en ingesta de divisas:', err.message);
  process.exit(1);
});
