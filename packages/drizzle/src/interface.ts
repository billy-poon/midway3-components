import type { DataSourceManagerConfigOption } from '@midwayjs/core'
import type { Placeholder, SelectedFields, SQL, Table } from 'drizzle-orm'
import { MySqlSelectBuilder } from 'drizzle-orm/mysql-core'
import { PgSelectBuilder } from 'drizzle-orm/pg-core'
import type { SQLiteSelectBuilder } from 'drizzle-orm/sqlite-core'
import type { LibSQLDataSourceOptions, LibSQLDrizzle } from './libsql/interface'
import type { MySQL2DataSourceOptions, MySQL2Drizzle } from './mysql2/interface'
import type { PostgresDataSourceOptions, PostgresDrizzle } from './postgres/interface'

export type Schema = Record<string, unknown>

export type DrizzleDataSourceOptions =
    | LibSQLDataSourceOptions
    | MySQL2DataSourceOptions
    | PostgresDataSourceOptions

type _SelectedFields = SelectedFields<any, any>

export interface Query<T> {
    where(where?: SQL): any
    limit(limit: number | Placeholder): any
    offset(offset: number | Placeholder): any
    orderBy(...items: SQL[]): any

    execute(): T[] | Promise<T[]>
}


export type JoinTypes = 'left' | 'right' | 'inner'
type SupportedSelectBuilder<T extends _SelectedFields> = (
    | SQLiteSelectBuilder<T, any, any>
    | MySqlSelectBuilder<T, any, any>
    | PgSelectBuilder<T, any>
) & {
    from<T>(table: Table | SQL): Query<T> & {
        [K in `${JoinTypes}Join`]: (table: Table | SQL, on: SQL) => unknown
    }
}

export type Drizzle<TSchema extends Schema = Schema> = (
    | LibSQLDrizzle<TSchema>
    | MySQL2Drizzle<TSchema>
    | PostgresDrizzle<TSchema>
) & {
    select<T extends SelectedFields<any, any>>(fields: T): SupportedSelectBuilder<T>
}

export type {
    LibSQLDrizzle,
    MySQL2Drizzle,
    PostgresDrizzle
}

export interface ConfigurationOptions {
    drizzle: DataSourceManagerConfigOption<DrizzleDataSourceOptions, never>
}
