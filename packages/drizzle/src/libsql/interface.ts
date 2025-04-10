import type { Client, Config } from '@libsql/client'
import type { DrizzleConfig } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { Schema } from '../interface'

export type LibSQLDataSourceOptions<TSchema extends Schema = Schema> =
    & { type: 'libsql' }
    & DrizzleConfig<TSchema>
    & ({
        connection: string | Config
    } | {
        client: Client
    })

export type LibSQLDrizzle<TSchema extends Schema = Schema> = LibSQLDatabase<TSchema> & {
    $client: Client
}
