import { Column } from 'drizzle-orm'
import { LibSQLDrizzle, MySQL2Drizzle, PostgresDrizzle } from './interface'

export function isMySQL(drizzle: object): drizzle is MySQL2Drizzle {
    return drizzle.constructor?.name === 'MySql2Database'
}

export function isPostgres(drizzle: object): drizzle is PostgresDrizzle {
    return drizzle.constructor?.name === 'NodePgDatabase'
}

export function isLibSQL(drizzle: object): drizzle is LibSQLDrizzle {
    return drizzle.constructor?.name === 'LibSQLDatabase'
}

export function isDrizzleColumn(column: unknown): column is Column<any> {
    return column instanceof Column
}
