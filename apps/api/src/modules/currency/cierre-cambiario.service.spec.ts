import { describe, it, expect, jest } from '@jest/globals';
import { CierreCambiarioService } from './cierre-cambiario.service';
import { TipoCotizacion } from './dto/create-cotizacion.dto';

const FILA_OK = {
  cotizacion_aplicada: '1200.0000',
  cotizacion_aproximada: false,
  fuente_cotizacion: 'DolarAPI',
  estado_sincronizacion: 'OK',
};

function crearServicio(filas: unknown[]) {
  const query = jest
    .fn<(sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>>()
    .mockResolvedValue({ rows: filas });
  const db = { query };
  return { servicio: new CierreCambiarioService(db as never), db };
}

describe('CierreCambiarioService (HU-23)', () => {
  it('devuelve la cotización de cierre como número cuando hay dato', async () => {
    const { servicio } = crearServicio([FILA_OK]);
    const r = await servicio.obtenerCotizacionCierre('2026-10-15T13:00:00Z', TipoCotizacion.PARALLEL);
    expect(r).toEqual({ cotizacionAplicada: 1200, esAproximada: false, fuente: 'DolarAPI', estado: 'OK' });
  });

  it('marca como aproximada la cotización con más de 24 h de antigüedad', async () => {
    const { servicio } = crearServicio([{ ...FILA_OK, cotizacion_aplicada: '1000.0000', cotizacion_aproximada: true }]);
    const r = await servicio.obtenerCotizacionCierre('2026-10-15T13:00:00Z');
    expect(r.esAproximada).toBe(true);
    expect(r.cotizacionAplicada).toBe(1000);
  });

  it('devuelve SIN_DATO y null (sin inventar valores) si no hay cotización', async () => {
    const { servicio } = crearServicio([
      { cotizacion_aplicada: null, cotizacion_aproximada: false, fuente_cotizacion: null, estado_sincronizacion: 'SIN_DATO' },
    ]);
    const r = await servicio.obtenerCotizacionCierre('2026-10-15T13:00:00Z');
    expect(r).toEqual({ cotizacionAplicada: null, esAproximada: false, fuente: null, estado: 'SIN_DATO' });
  });

  it('usa el dólar paralelo por defecto y pasa la fecha y el tipo a la función SQL', async () => {
    const { servicio, db } = crearServicio([]);
    await servicio.obtenerCotizacionCierre('2026-10-15T13:00:00Z');
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('fn_obtener_cotizacion_cierre'),
      ['2026-10-15T13:00:00Z', 'parallel'],
    );
  });

  describe('emparejarConCierre', () => {
    it('empareja una observación de las 10:00 con la cotización de cierre de su día', async () => {
      const { servicio } = crearServicio([FILA_OK]);
      const [obs] = await servicio.emparejarConCierre([{ id: 'a', fechaCaptura: '2026-10-22T13:00:00Z' }]);
      expect(obs.id).toBe('a');
      expect(obs.cierre.cotizacionAplicada).toBe(1200);
    });

    it('consulta la BD una sola vez por día local', async () => {
      const { servicio, db } = crearServicio([FILA_OK]);
      await servicio.emparejarConCierre([
        { fechaCaptura: '2026-10-22T13:00:00Z' },
        { fechaCaptura: '2026-10-22T20:00:00Z' },
        { fechaCaptura: '2026-10-23T13:00:00Z' },
      ]);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('agrupa por día de Argentina y no por día UTC (22:00 locales = 01:00Z del día siguiente)', async () => {
      const { servicio, db } = crearServicio([FILA_OK]);
      await servicio.emparejarConCierre([
        { fechaCaptura: '2026-10-22T13:00:00Z' },
        { fechaCaptura: '2026-10-23T01:00:00Z' },
      ]);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('devuelve SIN_DATO para las observaciones de un día sin cotización', async () => {
      const { servicio } = crearServicio([]);
      const [obs] = await servicio.emparejarConCierre([{ fechaCaptura: '2026-10-22T13:00:00Z' }]);
      expect(obs.cierre).toEqual({ cotizacionAplicada: null, esAproximada: false, fuente: null, estado: 'SIN_DATO' });
    });
  });
});