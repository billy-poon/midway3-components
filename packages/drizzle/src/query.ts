import { isTable, SelectedFields, SQL, Table } from 'drizzle-orm'
import { getDataSource } from './dataSourceManager'
import { EntityClass, getEntityDefinition } from './decorator/entity'
import { Drizzle, Query } from './interface'
import { isDrizzleColumn } from './utils'

export function entityQuery<T extends object>(clz: EntityClass<T>, dataSource?: Drizzle | string) {
    const { from, options, columns } = getEntityDefinition(clz)

    dataSource = dataSource ?? options?.dataSource
    const drizzle = typeof dataSource === 'object'
        ? dataSource : getDataSource(dataSource)

    const table: Table | undefined = isTable(from) ? from : undefined
    const fields = columns.reduce<SelectedFields<any, any>>(
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
