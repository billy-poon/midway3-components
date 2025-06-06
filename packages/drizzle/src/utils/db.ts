import { Column, SQL, SQLWrapper } from 'drizzle-orm'
import { Drizzle } from '../drizzle'
import { ColumnKeyOf, ColumnsOf, DrizzleColumn, Table } from '../types'

export function isDrizzleColumn(column: unknown): column is DrizzleColumn {
    return column instanceof Column
}


export function getTableColumns<T extends Table>(table: T) {
    return Object.entries(table)
        .reduce<ColumnsOf<T>>(
            (res, [k, v]) => {
                if (isDrizzleColumn(v)) {
                    res[k as ColumnKeyOf<T>] = v
                }
                return res
            },
            {}
        )
}

interface Dialect {
    sqlToQuery(sql: SQL): {
        sql: string
        params: unknown[]
    }
}

export function parseSQL(sql: SQLWrapper, drizzle: Drizzle) {
    const dialect = drizzle['dialect'] as Dialect
    return dialect.sqlToQuery(sql.getSQL())
}
