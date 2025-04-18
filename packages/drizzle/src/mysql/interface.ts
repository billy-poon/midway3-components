import type { MySql2Database, MySql2DrizzleConfig } from 'drizzle-orm/mysql2'
import type { Connection as CallbackConnection, Pool as CallbackPool, PoolOptions } from 'mysql2'
import type { Connection, Pool } from 'mysql2/promise'
import type { Schema } from '../interface'

export type MySql2Connection = Pool | Connection | CallbackPool | CallbackConnection

export type MySQL2DataSourceOptions<TSchema extends Schema = Schema> =
    & { type: 'mysql' }
    & MySql2DrizzleConfig<TSchema>
    & ({
        connection: string | PoolOptions
    } | {
        client: MySql2Connection
    })

export type MySQL2Drizzle<TSchema extends Schema = Schema> = MySql2Database<TSchema> & {
    $client: MySql2Connection
}
