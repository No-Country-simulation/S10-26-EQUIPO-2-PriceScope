import { describe, it, expect, jest } from '@jest/globals';
import { PipelineService } from './pipeline.service';

function createService(rows: unknown[]) {
  const query = jest
    .fn<(sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>>()
    .mockResolvedValue({ rows });
  const db = { query };
  return { service: new PipelineService(db as never), db };
}

describe('PipelineService (HU-43, HU-44, HU-45)', () => {
  const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // Hace 2 horas

  it('retorna estado OPERATIVO cuando las tiendas tienen corridas exitosas recientes', async () => {
    const mockTiendas = [
      {
        tienda_uuid: '11111111-1111-1111-1111-111111111111',
        tienda_id: 'carrefour',
        nombre: 'Carrefour',
        ultima_corrida_utc: recentDate,
        estado_corrida: 'EXITOSA',
        circuit_breaker_open: false,
        fallback_activo: false,
        publicaciones_procesadas: 50,
        publicaciones_fallidas: 0,
      },
      {
        tienda_uuid: '22222222-2222-2222-2222-222222222222',
        tienda_id: 'jumbo',
        nombre: 'Jumbo',
        ultima_corrida_utc: recentDate,
        estado_corrida: 'EXITOSA',
        circuit_breaker_open: false,
        fallback_activo: false,
        publicaciones_procesadas: 45,
        publicaciones_fallidas: 5,
      },
    ];

    const { service } = createService(mockTiendas);
    const result = await service.getStatus();

    expect(result.estado_global).toBe('OPERATIVO');
    expect(result.alerta_atraso_24h).toBe(false);
    expect(result.tiendas).toHaveLength(2);
    expect(result.tiendas[0].cobertura_pct).toBe(100);
    expect(result.tiendas[1].cobertura_pct).toBe(90);
  });

  it('retorna estado CRITICO y alerta_atraso_24h true cuando hay una corrida con más de 24h de retraso', async () => {
    const oldDate = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(); // Hace 30 horas

    const mockTiendas = [
      {
        tienda_uuid: '11111111-1111-1111-1111-111111111111',
        tienda_id: 'carrefour',
        nombre: 'Carrefour',
        ultima_corrida_utc: oldDate,
        estado_corrida: 'EXITOSA',
        circuit_breaker_open: false,
        fallback_activo: false,
        publicaciones_procesadas: 50,
        publicaciones_fallidas: 0,
      },
    ];

    const { service } = createService(mockTiendas);
    const result = await service.getStatus();

    expect(result.estado_global).toBe('CRITICO');
    expect(result.alerta_atraso_24h).toBe(true);
  });

  it('retorna estado CRITICO cuando la base de datos no tiene corridas registradas', async () => {
    const { service } = createService([]);
    const result = await service.getStatus();

    expect(result.estado_global).toBe('CRITICO');
    expect(result.tiendas).toEqual([]);
  });
});
