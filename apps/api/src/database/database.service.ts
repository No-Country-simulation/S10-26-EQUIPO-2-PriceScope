import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);
    private pool: Pool;

    onModuleInit() {
        const connectionString = process.env.DATABASE_URL;

        this.pool = connectionString
            ? new Pool({
                connectionString,
                ssl: {
                    rejectUnauthorized: false,
                },
            })
            : new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: Number(process.env.DB_PORT) || 5432,
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'postgres',
                ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
            });

        this.logger.log('Pool de conexión a PostgreSQL/TimescaleDB inicializado.');
    }

    async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        return this.pool.query<T>(text, params);
    }

    async onModuleDestroy() {
        await this.pool.end();
        this.logger.log('Conexión a la base de datos cerrada.');
    }
}