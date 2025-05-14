import { isTable, Placeholder, SQL, SQLWrapper, Table } from 'drizzle-orm'
import { getDataSource } from './dataSourceManager'
import { EntityClass, getEntityDefinition } from './decorator/entity'
import type { Drizzle, Executable } from './drizzle'
import { SelectedFields } from './types'
import { isDrizzleColumn } from './utils'

export type JoinType = 'left' | 'right' | 'inner'

export interface Query<T = unknown> extends Executable<T[]> {
    leftJoin: (table: Table | SQL, on: SQL) => unknown
    rightJoin: (table: Table | SQL, on: SQL) => unknown
    innerJoin: (table: Table | SQL, on: SQL) => unknown

    where(where?: SQL): any
    orderBy(...items: SQL[]): any

    offset(offset: number | Placeholder): any
    limit(limit: number | Placeholder): any
}

export type QueryConfig = {
    fields: SelectedFields

    where?: SQL
    limit?: number | Placeholder
    offset?: number | Placeholder
    orderBy?: SQLWrapper[]
}

export type QuerySession = {
    count(sql: SQL): Promise<number>
}

export type QueryResultOf<T extends Query> = T extends Query<infer P>
    ? P : never

export function createQuery<T extends object>(clz: EntityClass<T>, dataSource?: Drizzle | string) {
    const { from, options, columns } = getEntityDefinition(clz)

    dataSource = dataSource ?? options?.dataSource
    const drizzle = typeof dataSource === 'object'
        ? dataSource : getDataSource(dataSource)

    const table: Table | undefined = isTable(from) ? from : undefined
    const fields = columns.reduce<SelectedFields>(
        (res, x) => {
            const { propertyKey: key } = x
            let column = x.column
            if (column == null) {
                column = table?.[key]
                if (!isDrizzleColumn(column)) {
                    throw new Error(`Failed to infer column for: \`${clz.name}\`.${String(key)}`)
                }
            }

            res[key] = column
            return res
        },
        {}
    )


    type Fields = {
        [K in keyof T]: SQL<T[K]>
    }

    // if (!isPostgres(drizzle)) return;

    const result = drizzle.select(fields as Fields)
        .from(from)

    const { joins = [] } = options ?? {}
    if (joins.length > 0) {
        joins.forEach(({ type = 'left', from: _from, on }) => {
            const fn = `${type}Join` as const
            result[fn](_from, on)
        })
    }

    return result as Query<T>
}
