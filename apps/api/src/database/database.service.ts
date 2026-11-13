import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import * as dotenv from 'dotenv';

// Carga explícitamente el archivo .env ubicado en la carpeta actual (apps/api/.env)
dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);
    private pool: Pool;

    onModuleInit() {
        this.pool = new Pool(this.buildPoolConfig());
        this.logger.log('Pool de conexión a PostgreSQL/TimescaleDB inicializado.');
    }

    /**
     * Prioriza DATABASE_URL (Neon/producción, con SSL). Si no existe,
     * usa las variables DB_* individuales (entorno local, sin SSL).
     */
    private buildPoolConfig(): PoolConfig {
        const connectionString = process.env.DATABASE_URL?.trim();
        if (connectionString) {
            return {
                connectionString,
                ssl: { rejectUnauthorized: false },
                max: 10,
                connectionTimeoutMillis: 10000,
            };
        }
        return {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'postgres',
        };
    }

    async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        return this.pool.query<T>(text, params);
    }

    async onModuleDestroy() {
        await this.pool.end();
        this.logger.log('Conexión a la base de datos cerrada.');
    }
}