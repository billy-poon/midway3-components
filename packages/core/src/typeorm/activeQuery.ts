import { isClass } from '@midwayjs/core/dist/util/types'
import type { FindManyOptions, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm'
import { QueryInterface } from '../data/activeDataProvider'
import { ORDER } from '../data/sort'
import { getSortableOptions, SortableOptions } from '../decorator/sortable'
import { deepClone } from '../utils'

export class ActiveQuery<T extends ObjectLiteral> implements QueryInterface<T> {
    static create<T extends ObjectLiteral>(repository: Repository<T>) {
        return new ActiveQuery(repository)
    }

    protected options: FindManyOptions<T> = {}

    constructor(
        readonly repository: Repository<T>
    ) { }

    where(value: FindOptionsWhere<T> | FindOptionsWhere<T>[] | null) {
        this.options.where = value ?? undefined
    }

    limit(value: number | null): this {
        this.options.take = value ?? undefined
        return this
    }

    offset(value: number | null): this {
        this.options.skip = value ?? undefined
        return this
    }

    orderBy(value: Record<string, ORDER> | null): this {
        this.options.order = (value as any) ?? undefined
        return this
    }

    addOrderBy(value: Record<string, ORDER>): this {
        this.options.order = {
            ...value,
            ...this.options.order
        } as any

        return this
    }

    sortableOptions(): SortableOptions<T> {
        const { target, columns } = this.repository.metadata
        const getAttributes = () => {
            return columns.map(x => x.databaseName) as any
        }

        if (isClass(target)) {
            const result = getSortableOptions(target as any)
            if ((result.attributes ?? []).length === 0) {
                result.attributes = getAttributes()
            }

            return result
        }

        return {
            attributes: getAttributes()
        }
    }

    all(): Promise<T[]> {
        return this.repository.find(this.options)
    }

    one(): Promise<T | null> {
        return this.repository.findOne(this.options)
    }

    async count(q?: string): Promise<number> {
        return this.repository.count(this.options)
    }

    clone(): this {
        const { repository, options } = this
        const result = new ActiveQuery(repository)
        result['options'] = deepClone(options)
        return result as this
    }
}
