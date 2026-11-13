import { describe, it, expect, jest } from '@jest/globals';
import { UnprocessableEntityException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PipelineStatusResponse } from '../pipeline/types/pipeline.types';

describe('DashboardService (HU-26..30, HU-47, RN-09)', () => {
  const cierreOk = (valor: number) => ({
    cotizacionAplicada: valor,
    esAproximada: false,
    fuente: 'DolarAPI',
    estado: 'OK',
  });
  const mockCierre = {
    obtenerVariacionPeriodo: jest
      .fn<(desde: Date, hasta: Date) => Promise<unknown>>()
      .mockResolvedValue({ inicial: cierreOk(1000), final: cierreOk(1200), variacionPct: 20 }),
  };

  const mockPipelineStatus: PipelineStatusResponse = {
    estado_global: 'OPERATIVO',
    frescura_general_utc: '2026-11-07T12:00:00Z',
    alerta_atraso_24h: false,
    tiendas: [],
  };

  const mockPipelineService = {
    getStatus: jest
      .fn<() => Promise<PipelineStatusResponse>>()
      .mockResolvedValue(mockPipelineStatus),
  };

  it('lanza 422 si fecha_desde es posterior a fecha_hasta (RN-09)', async () => {
    const service = new DashboardService({ query: jest.fn() } as never, mockPipelineService as never, mockCierre as never);
    await expect(
      service.getDashboardData({
        fecha_desde: '2026-11-05',
        fecha_hasta: '2026-11-01',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('lanza 422 si el rango excede 365 días (RN-09)', async () => {
    const service = new DashboardService({ query: jest.fn() } as never, mockPipelineService as never, mockCierre as never);
    await expect(
      service.getDashboardData({
        fecha_desde: '2025-01-01',
        fecha_hasta: '2026-02-01',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('retorna DashboardResponse completo con KPIs, categorías, series y pipeline_status', async () => {
    const mockCategorias = [
      {
        categoria_id: 'cat-1',
        nombre: 'Canasta Básica',
        mediana_precio: '5.2',
        cantidad_productos: 10,
        cobertura_pct: '98.5',
      },
    ];

    const mockSeries = [
      {
        timestamp_utc: '2026-10-01T00:00:00Z',
        precio_regular: 1000,
        precio_promocional: null,
        precio_usd: 1.0,
        estado_dato: 'DATO_VALIDO',
        cotizacion_aplicada: 1000,
        cotizacion_aproximada: false,
        motivo: null,
      },
      {
        timestamp_utc: '2026-10-30T00:00:00Z',
        precio_regular: 1200,
        precio_promocional: null,
        precio_usd: 1.0,
        estado_dato: 'DATO_VALIDO',
        cotizacion_aplicada: 1200,
        cotizacion_aproximada: false,
        motivo: null,
      },
    ];

    const query = jest
      .fn<(sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>>()
      .mockImplementation(async (sql: string) => {
        if (sql.includes('FROM categorias')) return { rows: mockCategorias };
        return { rows: mockSeries };
      });

    const service = new DashboardService({ query } as never, mockPipelineService as never, mockCierre as never);

    const result = await service.getDashboardData({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-30',
    });

    expect(result.kpis.variacion_pesos.porcentaje).toBe(20); // (1200 - 1000) / 1000 = +20%
    expect(result.kpis.comparacion_devaluacion.variacion_cotizacion_pct).toBe(20);
    expect(result.kpis.comparacion_devaluacion.diferencial_puntos).toBe(0);
    expect(result.variacion_por_categoria).toHaveLength(1);
    expect(result.variacion_por_categoria[0].nombre).toBe('Canasta Básica');
    expect(result.grafico_evolucion.metadata.downsampling_aplicado).toBe(false);
    expect(result.pipeline_status.estado_global).toBe('OPERATIVO');
  });

  it('aplica downsampling semanal cuando el rango supera 90 días (HU-47)', async () => {
    const query = jest
      .fn<(sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>>()
      .mockResolvedValue({ rows: [] });

    const service = new DashboardService({ query } as never, mockPipelineService as never, mockCierre as never);

    const result = await service.getDashboardData({
      fecha_desde: '2026-06-01',
      fecha_hasta: '2026-10-01', // ~122 días
    });

    expect(result.grafico_evolucion.metadata.downsampling_aplicado).toBe(true);
    expect(result.grafico_evolucion.metadata.intervalo_agrupacion).toBe('1w');
  });
});
