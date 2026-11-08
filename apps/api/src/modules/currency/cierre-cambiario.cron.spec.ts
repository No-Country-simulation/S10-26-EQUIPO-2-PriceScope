import { describe, it, expect, jest } from '@jest/globals';
import { CierreCambiarioCron } from './cierre-cambiario.cron';

type Consulta = (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
type Cierre = {
  cotizacionAplicada: number | null;
  esAproximada: boolean;
  fuente: string | null;
  estado: 'OK' | 'SIN_DATO';
};
type ObtenerCierre = (fecha: string) => Promise<Cierre>;

const OK_1300: Cierre = { cotizacionAplicada: 1300, esAproximada: false, fuente: 'DolarAPI', estado: 'OK' };
const SIN_DATO: Cierre = { cotizacionAplicada: null, esAproximada: false, fuente: null, estado: 'SIN_DATO' };

function crearCron(diasPendientes: string[], obtener: ObtenerCierre) {
  const query = jest
    .fn<Consulta>()
    .mockImplementation(async (sql) =>
      sql.includes('SELECT DISTINCT') ? { rows: diasPendientes.map((dia) => ({ dia })) } : { rows: [] },
    );
  const obtenerCotizacionCierre = jest.fn<ObtenerCierre>().mockImplementation(obtener);
  const cron = new CierreCambiarioCron({ query } as never, { obtenerCotizacionCierre } as never);
  const updates = () => query.mock.calls.filter(([sql]) => sql.includes('UPDATE'));
  return { cron, obtenerCotizacionCierre, updates };
}

describe('CierreCambiarioCron (captura del cierre a las 00:01 ART)', () => {
  it('completa la cotización de cada día pendiente', async () => {
    const { cron, updates } = crearCron(['2026-11-05'], async () => OK_1300);
    await cron.capturarCierreDelDia();
    expect(updates()).toHaveLength(1);
    expect(updates()[0][1]).toEqual([1300, false, 'DolarAPI', 'America/Argentina/Buenos_Aires', '2026-11-05']);
  });

  it('pide el cierre de cada día a mediodía hora Argentina', async () => {
    const { cron, obtenerCotizacionCierre } = crearCron(['2026-11-05'], async () => OK_1300);
    await cron.capturarCierreDelDia();
    expect(obtenerCotizacionCierre).toHaveBeenCalledWith('2026-11-05T12:00:00-03:00');
  });

  it('no actualiza nada (ni inventa valores) si el día no tiene cotización de cierre', async () => {
    const { cron, updates } = crearCron(['2026-11-05'], async () => SIN_DATO);
    await cron.capturarCierreDelDia();
    expect(updates()).toHaveLength(0);
  });

  it('si falla un día, sigue con el siguiente', async () => {
    const { cron, updates } = crearCron(['2026-11-04', '2026-11-05'], async (fecha) => {
      if (fecha.startsWith('2026-11-04')) throw new Error('fallo de prueba');
      return OK_1300;
    });
    await cron.capturarCierreDelDia();
    expect(updates()).toHaveLength(1);
    expect(updates()[0][1]).toContain('2026-11-05');
  });

  it('no hace nada si no hay días pendientes', async () => {
    const { cron, obtenerCotizacionCierre, updates } = crearCron([], async () => OK_1300);
    await cron.capturarCierreDelDia();
    expect(obtenerCotizacionCierre).not.toHaveBeenCalled();
    expect(updates()).toHaveLength(0);
  });
});