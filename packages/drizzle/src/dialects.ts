import { MySQL2DataSourceOptions, MySQL2Drizzle, MySQLExecuteResult } from './mysql/interface'
import { PostgresDataSourceOptions, PostgresDrizzle, PostgresExecuteResult } from './postgresql/interface'
import { SQLiteDataSourceOptions, SQLiteDrizzle, SQLiteExecuteResult } from './sqlite/interface'
import { sqliteProtocols, SQLiteProtocolType } from './sqlite/protocol'

export type {
    MySQL2DataSourceOptions,
    MySQL2Drizzle,
    PostgresDataSourceOptions,
    PostgresDrizzle,
    SQLiteDataSourceOptions,
    SQLiteDrizzle
}

export { sqliteProtocols }

export const dialects = ['mysql', 'postgresql', 'sqlite'] as const
export type DialectType = (typeof dialects)[number]
export type ProtocolType = Exclude<DialectType, 'sqlite'> | SQLiteProtocolType

export function isMySQL(drizzle: unknown): drizzle is MySQL2Drizzle {
    return instanceOf(drizzle, 'MySql2')
}

export function isPostgres(drizzle: unknown): drizzle is PostgresDrizzle {
    return instanceOf(drizzle, 'NodePg')
}

export function isSQLite(drizzle: unknown): drizzle is SQLiteDrizzle {
    return instanceOf(drizzle, 'LibSQL')
}

export function isMySQLResult(obj: unknown): obj is MySQLExecuteResult {
    return typeof obj?.['affectedRows'] === 'number'
}

export function isPostgresResult(obj: unknown): obj is PostgresExecuteResult {
    return typeof obj?.['rowCount'] === 'number'
}

export function isSQLiteResult(obj: unknown): obj is SQLiteExecuteResult {
    return typeof obj?.['rowsAffected'] === 'number'
}

function instanceOf(obj: unknown, clzNamePrefix: string) {
    return typeof obj === 'object'
        && (obj?.constructor?.name.startsWith(clzNamePrefix) ?? false)
}
