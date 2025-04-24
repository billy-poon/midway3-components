import { Attributes, FindOptions, Model, WhereOptions } from 'sequelize'
import { QueryInterface } from '../data/activeDataProvider'
import { getSortableOptions, SortableOptions } from '../decorator/sortable'
import { deepClone } from '../utils'

type ModelConstructor<T> = (new (...args: any) => T) & typeof Model
type Arguments<T> = T extends (...args: infer P) => any ? P : never

export class ActiveQuery<T extends Model> implements QueryInterface<T> {
    static create<M extends Model>(modelClass: ModelConstructor<M>) {
        return new ActiveQuery(modelClass)
    }

    protected options: FindOptions<Attributes<T>> = {}

    constructor(
        readonly modelClass: ModelConstructor<T>
    ) { }

    protected invoke<F extends () => any>(fn: F, ...args: Arguments<F>): ReturnType<F> {
        return fn.call(this.modelClass, ...args)
    }

    async all(): Promise<T[]> {
        const result = await this.invoke(this.modelClass.findAll<T>, this.options)
        return result
    }

    async one(): Promise<T | null> {
        const result = await this.invoke(this.modelClass.findOne<T>, this.options)
        return result
    }

    async count(): Promise<number> {
        const result = await this.invoke(this.modelClass.count<T>, this.options)
        return result
    }

    clone(): this {
        const options = deepClone(this.options)
        const result = new ActiveQuery<T>(this.modelClass)
        result['options'] = options

        return result as this
    }

    where(where: WhereOptions<Attributes<T>> | null): this {
        this.options.where = where ?? undefined
        return this
    }

    limit(value: number | null): this {
        this.options.limit = value ?? undefined
        return this
    }

    offset(value: number | null): this {
        this.options.offset = value ?? undefined
        return this
    }

    orderBy(value: Record<string, 'asc' | 'desc'> | null): this {
        const items = Object.entries(value ?? {})
        this.options.order = items.length > 0
            ? items : undefined

        return this
    }

    addOrderBy(value: Record<string, 'asc' | 'desc'>): this {
        const { order = [] } = this.options
        this.options.order = [
            ...(Array.isArray(order) ? order : [order]),
            ...Object.entries(value)
        ]

        return this
    }

    sortableOptions(): SortableOptions<T> {
        const result = getSortableOptions(this.modelClass)
        if ((result.attributes ?? []).length == 0) {
            const attrs = this.invoke(this.modelClass.getAttributes<T>)
            result.attributes = Object.keys(attrs) as any
        }
        return result
    }
}
