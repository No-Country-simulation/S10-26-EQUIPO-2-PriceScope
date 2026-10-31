import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class AlertsService {
    // Inyecta aquí tu DatabaseService o repositorio cuando esté listo

    async findAll(paginationQuery: PaginationQueryDto) {
        const page = Number(paginationQuery.page) || 1;
        const limit = Math.min(Number(paginationQuery.limit) || 50, 50); // Garantiza máximo estricto de 50
        const offset = (page - 1) * limit;

        // TODO: Reemplazar con la consulta real a PostgreSQL/TimescaleDB
        // Ejemplo lógico:
        // const [data, total_registros] = await this.db.findAndCount({ limit, offset });

        // Simulación de datos para pruebas iniciales:
        const data: any[] = []; // Aquí irán los registros devueltos
        const total_registros = 120; // Conteo total en BD
        const total_paginas = Math.ceil(total_registros / limit);

        return {
            alerts: data,
            paginacion: {
                pagina_actual: page,
                limite_por_pagina: limit,
                total_registros,
                total_paginas,
            },
        };
    }
}