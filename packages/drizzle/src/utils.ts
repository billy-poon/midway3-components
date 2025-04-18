import { Column } from 'drizzle-orm'
import { LibSQLDrizzle, MySQL2Drizzle, MySQLExecuteResult, PgExecuteResult, PostgresDrizzle, SQLiteExecuteResult } from './interface'

export function isMySQL(drizzle: unknown): drizzle is MySQL2Drizzle {
    return instanceOf(drizzle, 'MySql2Database')
}

export function isPostgres(drizzle: unknown): drizzle is PostgresDrizzle {
    return instanceOf(drizzle, 'NodePgDatabase')
}

export function isSQLite(drizzle: unknown): drizzle is LibSQLDrizzle {
    return instanceOf(drizzle, 'LibSQLDatabase')
}

export function isMySQLResult(obj: unknown): obj is MySQLExecuteResult {
    return isObj(obj)
        && typeof obj['affectedRows'] === 'number'
}

export function isPostgresResult(obj: unknown): obj is PgExecuteResult {
    return isObj(obj)
        && typeof obj['rowCount'] === 'number'
}

export function isSQLiteResult(obj: unknown): obj is SQLiteExecuteResult {
    return isObj(obj)
        && typeof obj['rowsAffected'] === 'number'
}

function instanceOf(obj: unknown, ctorName: string) {
    return isObj(obj)
        && obj.constructor?.name === ctorName
}

function isObj(obj: unknown): obj is object {
    return obj != null && typeof obj === 'object'
}

export function isDrizzleColumn(column: unknown): column is Column<any> {
    return column instanceof Column
}
