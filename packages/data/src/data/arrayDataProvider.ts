import { BaseDataProvider } from './baseDataProvider'
import { Sort } from './sort'

const emptyValues = [undefined, null] as const

function compare(x: unknown, y: unknown) {
    if (x === y) {
        return 0
    }

    const [xt, yt] = [typeof x, typeof y]
    if (xt !== yt) {
        return xt.localeCompare(yt)
    }

    for (const v of emptyValues) {
        if (x === v) return -1
        if (y === v) return 1
    }

    if (xt === 'boolean' || xt === 'number') {
        return Number(x) - Number(y)
    }

    if (x instanceof Date) {
        return y instanceof Date
            ? x.valueOf() - y.valueOf()
            : -1
    }

    return String(x).localeCompare(String(y))

}

export class ArrayDataProvider<T = unknown> extends BaseDataProvider<T> {
    constructor(
        readonly allModels: T[]
    ) {
        super()
    }

    protected async prepareModels(): Promise<T[]> {
        let items = this.allModels
        if (items == null) return []

        const sort = this.getSort()
        if (sort !== false) {
            items = this.sortModels(items, sort)
        }

        const pagination = this.getPagination()
        if (pagination !== false) {
            pagination.totalCount = await this.getTotalCount()

            if (pagination.getPageSize() > 0) {
                const [offset, limit] = [pagination.getOffset(), pagination.getLimit()]
                return items.slice(offset, limit != null ? offset + limit : undefined)
            }
        }

        return items
    }

    protected async prepareTotalCount(): Promise<number> {
        return (this.allModels ?? []).length
    }

    protected sortModels(models: T[], sort: Sort<T>) {
        const items = Object.entries(sort.getOrders())
        if (items.length > 0) {
            models = models.sort((x, y) => {
                for (const [k, v] of items) {
                    const [xv, yv] = [(x as any)[k], (y as any)[k]]
                    const result = compare(xv, yv)
                    if (result !== 0) {
                        return v === 'desc'
                            ? -result : result
                    }
                }

                return 0
            })
        }

        return models
    }
}
