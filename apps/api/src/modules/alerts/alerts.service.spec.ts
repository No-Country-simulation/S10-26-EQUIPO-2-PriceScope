import { describe, it, expect, jest } from '@jest/globals';
import { UnprocessableEntityException } from '@nestjs/common';
import { AlertsService } from './alerts.service';

describe('AlertsService (HU-37, HU-39, HU-46)', () => {
  it('lanza 422 Unprocessable Entity cuando limit supera 50 según RN-06', async () => {
    const service = new AlertsService({ query: jest.fn() } as never);

    await expect(service.findAll({ limit: 100 })).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('retorna la lista paginada de alertas inflacionarias con diferencial de puntos', async () => {
    const mockCotiz = [{ cotizacion: '1000' }, { cotizacion: '1200' }]; // +20% devaluación
    const mockAlertData = [
      {
        producto_canonico_id: 'prod-1',
        producto_nombre: 'Aceite de Girasol',
        tienda_nombre: 'Carrefour',
        inicio_utc: '2026-10-01T00:00:00Z',
        fin_utc: '2026-10-31T00:00:00Z',
        precio_inicial: 1000,
        precio_final: 1300,
        variacion_precio_pct: 30, // +30% precio
        cobertura_pct: 95,
        cotizacion_usada_cierre: 1200,
      },
    ];

    const query = jest
      .fn<(sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>>()
      .mockImplementation(async (sql: string) => {
        if (sql.includes('FROM cotizaciones_divisas')) {
          return { rows: mockCotiz };
        }
        if (sql.includes('COUNT(*) AS total')) {
          return { rows: [{ total: '1' }] };
        }
        return { rows: mockAlertData };
      });

    const service = new AlertsService({ query } as never);
    const result = await service.findAll({ page: 1, limit: 50 });

    expect(result.paginacion.pagina_actual).toBe(1);
    expect(result.paginacion.total_registros).toBe(1);
    expect(result.alertas).toHaveLength(1);

    const alerta = result.alertas[0];
    expect(alerta.producto_nombre).toBe('Aceite de Girasol');
    expect(alerta.variacion_precio_pct).toBe(30);
    expect(alerta.variacion_cotizacion_pct).toBe(20);
    expect(alerta.diferencial_puntos).toBe(10); // 30 - 20 = +10 puntos
    expect(alerta.tipo_alerta).toBe('PRECIO_SUPERA_DEVALUACION');
  });
});
