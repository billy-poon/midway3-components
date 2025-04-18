import type { DrizzleConfig } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Client, Pool, PoolClient, PoolConfig } from 'pg'
import type { Schema } from '../interface'

export type NodePgClient = Pool | PoolClient | Client

export type PostgresDataSourceOptions<TSchema extends Schema = Schema> =
    & { type: 'postgresql' }
    & DrizzleConfig<TSchema>
    & ({
        connection: string | PoolConfig
    } | {
        client: NodePgClient
    })

export type PostgresDrizzle<TSchema extends Schema = Schema> = NodePgDatabase<TSchema> & {
    $client: NodePgClient
}
