import { Pagination } from './pagination'
import { Sort } from './sort'

export interface DataProviderInterface<T> {
    prepare(forcePrepare?: boolean): Promise<void>
    getCount(): Promise<number>
    getTotalCount(): Promise<number>
    getModels(): Promise<T[]>
    // getKeys()
    getSort(): Sort<T> | false
    getPagination(): Pagination | false
}


export function isDataProvider<T = unknown>(val: unknown): val is BaseDataProvider<T> {
    return val instanceof BaseDataProvider
}


export abstract class BaseDataProvider<T = unknown> implements DataProviderInterface<T> {
    protected abstract prepareModels(): Promise<T[]>
    protected abstract prepareTotalCount(): Promise<number>

    async prepare(forcePrepare = false) {
        if (this._models == null || forcePrepare) {
            this._models = await this.prepareModels()
        }
    }

    private _models?: T[]
    async getModels() {
        await this.prepare()
        return this._models ?? []
    }

    setModels(value: T[] | null) {
        this._models = value ?? undefined
    }

    async getCount() {
        const models = await this.getModels()
        return models.length
    }

    private _totalCount?: number
    async getTotalCount() {
        const pagination = this.getPagination()
        if (pagination === false) {
            return this.getCount()
        } else if (this._totalCount == null) {
            const result = await this.prepareTotalCount()
            // pagination.totalCount =  result
            this._totalCount = result
        }

        return this._totalCount!
    }

    setTotalCount(value: number | null) {
        this._totalCount = value ?? undefined
    }

    private _pagination?: Pagination | false
    hasPagination() {
        return this._pagination != null
    }

    getPagination(): Pagination | false {
        if (this._pagination == null) {
            this.setPatination(new Pagination())
        }

        return this._pagination!
    }

    setPatination(value: Pagination | false | null) {
        this._pagination = value ?? undefined
    }

    private _sort?: Sort<T> | false
    hasSort() {
        return this._sort != null
    }

    getSort(): Sort<T> | false {
        if (this._sort == null) {
            this.setSort(new Sort<T>())
        }

        return this._sort!
    }

    setSort(value: Sort<T> | false | null) {
        this._sort = value ?? undefined
    }

    refresh() {
        this._totalCount = undefined
        this._models = undefined
    }
}
