import { Drizzle, LibSQLDrizzle, MySQL2Drizzle, PostgresDrizzle, Schema } from './interface'

export function isMySQL<T extends Schema>(drizzle: Drizzle<T>): drizzle is MySQL2Drizzle<T> {
    return drizzle.constructor?.name === 'MySql2Database'
}

export function isPostgres<T extends Schema>(drizzle: Drizzle<T>): drizzle is PostgresDrizzle<T> {
    return drizzle.constructor?.name === 'NodePgDatabase'
}

export function isLibSQL<T extends Schema>(drizzle: Drizzle<T>): drizzle is LibSQLDrizzle<T> {
    return drizzle.constructor?.name === 'LibSQLDatabase'
}
