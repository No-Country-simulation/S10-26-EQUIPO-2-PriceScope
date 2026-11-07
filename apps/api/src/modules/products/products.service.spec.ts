import { describe, it, expect, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService (HU-16, HU-19, HU-35)', () => {
  const mockProduct = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    slug: 'leche-entera-la-serenisima-1l',
    nombre_normalizado: 'Leche Entera La Serenísima 1L',
    marca: 'La Serenísima',
    modelo: null,
    categoria_nombre: 'Lácteos',
    contenido_neto_valor: '1.0000',
    contenido_neto_unidad: 'L',
    pack: 'x1',
  };

  const mockObservations = [
    {
      timestamp_utc: '2026-11-06T12:00:00Z',
      tienda_id: 'carrefour',
      tienda_nombre: 'Carrefour',
      url_origen: 'https://carrefour.com.ar/leche',
      sku_tienda: 'SKU-123',
      alias_producto: 'Leche Entera 1 Litro',
      precio_regular: '1200.00',
      precio_promocional: '1100.00',
      precio_por_unidad: '1200.00',
      unidad_medida: 'L',
      estado_dato: 'DATO_VALIDO',
      cotizacion_aplicada: '1000.0000',
      cotizacion_aproximada: false,
      fuente_cotizacion: 'DolarAPI',
      motivo_faltante: null,
    },
    {
      timestamp_utc: '2026-11-05T12:00:00Z',
      tienda_id: 'carrefour',
      tienda_nombre: 'Carrefour',
      url_origen: 'https://carrefour.com.ar/leche',
      sku_tienda: 'SKU-123',
      alias_producto: 'Leche Entera 1 Litro',
      precio_regular: '1000.00',
      precio_promocional: null,
      precio_por_unidad: '1000.00',
      unidad_medida: 'L',
      estado_dato: 'DATO_VALIDO',
      cotizacion_aplicada: '1000.0000',
      cotizacion_aproximada: false,
      fuente_cotizacion: 'DolarAPI',
      motivo_faltante: null,
    },
  ];

  it('lanza NotFoundException cuando el producto no existe en el catálogo', async () => {
    const query = jest
      .fn<(sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>>()
      .mockResolvedValue({ rows: [] });
    const service = new ProductsService({ query } as never);

    await expect(
      service.getProductTraceability('no-existe-slug', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('retorna la ficha de trazabilidad completa con cálculos de variación y precio USD', async () => {
    const query = jest
      .fn<(sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>>()
      .mockImplementation(async (sql: string) => {
        if (sql.includes('FROM productos_canonicos')) {
          return { rows: [mockProduct] };
        }
        if (sql.includes('FROM historial_contenido')) {
          return { rows: [] };
        }
        if (sql.includes('FROM observaciones_precios')) {
          return { rows: mockObservations };
        }
        return { rows: [] };
      });

    const service = new ProductsService({ query } as never);
    const result = await service.getProductTraceability(mockProduct.id, {});

    expect(result.producto.id).toBe(mockProduct.id);
    expect(result.producto.slug).toBe(mockProduct.slug);
    expect(result.historico_observaciones).toHaveLength(2);

    const obsReciente = result.historico_observaciones[0];
    expect(obsReciente.precio_usd).toBe(1.2); // 1200 / 1000 = 1.2 USD
    expect(obsReciente.variacion_diaria_pct).toBe(20); // (1200 - 1000) / 1000 * 100 = +20%
  });

  it('respeta la regla anti-cero (RN-04): nunca devuelve 0 en precios', async () => {
    const obsCero = [
      {
        ...mockObservations[0],
        precio_regular: '0.00',
        precio_promocional: '0.00',
        estado_dato: 'AGOTADO',
      },
    ];

    const query = jest
      .fn<(sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>>()
      .mockImplementation(async (sql: string) => {
        if (sql.includes('FROM productos_canonicos')) return { rows: [mockProduct] };
        if (sql.includes('FROM historial_contenido')) return { rows: [] };
        return { rows: obsCero };
      });

    const service = new ProductsService({ query } as never);
    const result = await service.getProductTraceability(mockProduct.id, {});

    expect(result.historico_observaciones[0].precio_regular).toBeNull();
    expect(result.historico_observaciones[0].precio_promocional).toBeNull();
    expect(result.historico_observaciones[0].precio_usd).toBeNull();
  });
});
