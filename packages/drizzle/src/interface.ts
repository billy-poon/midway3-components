import { DataSourceManagerConfigOption } from '@midwayjs/core'
import { LibSQLDataSourceOptions, LibSQLDrizzle } from './libsql/interface'
import { MySQL2DataSourceOptions, MySQL2Drizzle } from './mysql2/interface'
import { PostgresDataSourceOptions, PostgresDrizzle } from './postgres/interface'

export type Schema = Record<string, unknown>

export type DrizzleDataSourceOptions =
    | LibSQLDataSourceOptions
    | MySQL2DataSourceOptions
    | PostgresDataSourceOptions

export type Drizzle<TSchema extends Schema = Schema> =
    | LibSQLDrizzle<TSchema>
    | MySQL2Drizzle<TSchema>
    | PostgresDrizzle<TSchema>

export type {
    LibSQLDrizzle,
    MySQL2Drizzle,
    PostgresDrizzle
}

export interface ConfigurationOptions {
    drizzle: DataSourceManagerConfigOption<DrizzleDataSourceOptions, never>
}
