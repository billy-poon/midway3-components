import { QueryInterface, SortableOptions } from '@midway3-components/data'
import { ORDER } from '@midway3-components/data/dist/data'
import { desc, Placeholder, SQL, sql, SQLWrapper } from 'drizzle-orm'

interface Query<T> {
    where(where?: SQL): any
    limit(limit: number | Placeholder): any
    offset(offset: number | Placeholder): any
    orderBy(...items: SQL[]): any

    execute(): T[] | Promise<T[]>
}

export type QueryConfig = {
    fields?: Record<string, unknown>

    where?: SQL
    limit?: number | Placeholder
    offset?: number | Placeholder
    orderBy?: SQLWrapper[]
}

export type QuerySession = {
    count(sql: SQL): Promise<number>
}


type ActiveRecord<Q extends Query<any>> = Awaited<ReturnType<Q['execute']>>[number]

export class ActiveQuery<Q extends Query<any>> implements QueryInterface<ActiveRecord<Q>> {
    constructor(
        readonly query: Q
    ) { }

    protected getConfig(): QueryConfig {
        return this.query['config'] ?? {}
    }

    where(where: SQL): this {
        this.query.where(where)
        return this
    }

    limit(value: number | null): this {
        if (value != null) {
            this.query.limit(value)
        } else {
            this.getConfig()['limit'] = undefined
        }
        return this
    }

    offset(value: number | null): this {
        if (value != null) {
            this.query.offset(value)
        } else {
            this.getConfig()['offset'] = undefined
        }
        return this
    }

    orderBy(value: Record<string, ORDER> | null): this {
        if (value != null) {
            const items = Object.entries(value)
                .map(([k, v]) => {
                    const column = sql.raw(k)
                    return v === 'desc'
                        ? desc(column) : column
                })
            this.query.orderBy(...items)
        } else {
            this.getConfig()['orderBy'] = undefined
        }

        return this
    }

    addOrderBy(value: Record<string, ORDER>): this {
        const getOrderBy = () => this.query['config']['orderBy'] ?? []

        const items = getOrderBy()

        this.orderBy(value)
        this.query['config']['orderBy'] = [
            ...items,
            ...getOrderBy(),
        ]

        return this
    }

    sortableOptions(): SortableOptions<ActiveRecord<Q>> {
        const fields = Object.keys(this.getConfig().fields ?? {})
        return { attributes: fields as any }
    }

    async all(): Promise<ActiveRecord<Q>[]> {
        return this.query.execute()
    }

    async one(): Promise<ActiveRecord<Q>> {
        const [row] = await this.limit(1).all()
        return row ?? null
    }

    protected getSession(): QuerySession {
        const result = this.query['session']
        if (result == null) {
            throw new Error('Failed to resolve session.')
        }

        return result
    }

    async count(): Promise<number> {
        const command = sql`select count(*) as count from (${this.query}) as __`
        return this.getSession().count(command)
    }
}
