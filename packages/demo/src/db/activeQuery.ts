import { getSortableOptions, QueryInterface, SortableOptions } from '@midway3-components/data'
import { Attributes, FindOptions, Model, WhereOptions } from 'sequelize'
import { cloneDeep } from 'sequelize/lib/utils'
import { NotImplementedError } from '../error/notImplementedError'

type M<T> = new (...args: any) => T
type Arguments<T> = T extends (...args: infer P) => any ? P : never

export class ActiveQuery<T extends Model> implements QueryInterface<T> {
    static create<T extends Model>(modelClass: M<T>) {
        return new ActiveQuery(modelClass)
    }

    protected options: FindOptions<Attributes<T>> = {}

    constructor(
        readonly modelClass: M<T>
    ) { }

    protected invoke<F extends () => any>(fn: F, ...args: Arguments<F>): ReturnType<F> {
        return fn.call(this.modelClass, ...args)
    }

    async all(): Promise<T[]> {
        const result = await this.invoke(Model.findAll<T>, this.options)
        return result
    }

    async one(): Promise<T | null> {
        const result = await this.invoke(Model.findOne<T>, this.options)
        return result
    }

    async count(q?: string): Promise<number> {
        const result = await this.invoke(Model.count<T>, this.options)
        return result
    }

    async exists(): Promise<boolean> {
        throw new NotImplementedError()
    }

    clone(): this {
        const options = cloneDeep(this.options)
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
            const attrs = this.invoke(Model.getAttributes<T>)
            result.attributes = Object.keys(attrs) as any
        }
        return result
    }
}
