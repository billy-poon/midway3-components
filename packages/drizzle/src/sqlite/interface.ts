import type { Client, Config } from '@libsql/client'
import type { DrizzleConfig } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { Schema } from '../types'

export type SQLiteDataSourceOptions<TSchema extends Schema = Schema> =
    & { type: 'sqlite' }
    & DrizzleConfig<TSchema>
    & ({
        connection: string | Config
    } | {
        client: Client
    })

export type SQLiteDrizzle<TSchema extends Schema = Schema> = LibSQLDatabase<TSchema> & {
    $client: Client
}

export interface SQLiteExecuteResult {
    columns: unknown[]
    columnTypes: unknown[]
    rows: unknown[]
    rowsAffected: number
    lastInsertRowid: string
}
