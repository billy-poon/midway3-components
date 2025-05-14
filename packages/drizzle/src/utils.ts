import { Column as DrizzleColumn } from 'drizzle-orm'
import { Column, ColumnKeyOf, ColumnsOf, Table } from './types'

export function isDrizzleColumn(column: unknown): column is Column {
    return column instanceof DrizzleColumn
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
