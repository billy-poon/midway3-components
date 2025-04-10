import { SortableOptions } from '../decorator/sortable'
import { configure } from '../utils'
import { BaseDataProvider } from './baseDataProvider'
import { ORDER, Sort } from './sort'

export interface QueryInterface<T> {
    limit(value: number | null): this
    offset(value: number | null): this
    orderBy(value: Record<string, ORDER> | null): this
    addOrderBy(value: Record<string, ORDER>): this
    sortableOptions?(): SortableOptions<T>

    all(): Promise<T[]>
    one(): Promise<T | null>
    count(q?: string): Promise<number>

    clone?(): this
}

export class ActiveDataProvider<T = unknown> extends BaseDataProvider<T> {
    static create<T>(query: QueryInterface<T>) {
        return new ActiveDataProvider(query)
    }

    constructor(
        readonly query: QueryInterface<T>
    ) {
        super()
    }

    protected async prepareModels(): Promise<T[]> {
        const { query } = this
        const pagination = this.getPagination()
        if (pagination !== false) {
            pagination.totalCount = await this.getTotalCount()
            if (pagination.totalCount === 0) {
                return []
            }

            query
                .offset(pagination.getOffset())
                .limit(pagination.getLimit())
        }

        const sort = this.getSort()
        if (sort !== false) {
            const orders = sort.getOrders()
            query.addOrderBy(orders)
        }

        return query.all()
    }

    protected async prepareTotalCount(): Promise<number> {
        let { query } = this
        if (typeof query.clone === 'function') {
            query = query.clone()
                .offset(null)
                .limit(null)
                .orderBy(null)
        }

        return query.count()
    }

    setSort(value: false | Sort<T> | null): void {
        super.setSort(value)

        const sort = this.getSort()
        if (sort) {
            if (sort.enableMultiSort == null) {
                sort.enableMultiSort = true
            }

            if (sort.attributes == null &&
                typeof this.query.sortableOptions === 'function'
            ) {
                const options = this.query.sortableOptions()
                configure(sort, options)
            }
        }
    }
}
