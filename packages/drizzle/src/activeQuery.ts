import { Class, getSortableOptions, QueryInterface, SortableOptions } from '@midway3-components/core'
import { ORDER } from '@midway3-components/core/dist/data'
import { isClass } from '@midwayjs/core/dist/util/types'
import { plainToInstance } from 'class-transformer'
import { asc, desc, Placeholder, SQL, sql, SQLWrapper } from 'drizzle-orm'
import { EntityClass } from './decorator/entity'
import { triggerOnLoad } from './decorator/load'
import { Query, QueryResult } from './interface'
import { entityQuery } from './query'
import { isDrizzleColumn } from './utils'

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


export class ActiveQuery<T extends object> implements QueryInterface<T> {
    static create<T extends object>(entityClz: EntityClass<T>): ActiveQuery<Query<T>>
    static create<Q extends Query>(query: Q): ActiveQuery<QueryResult<Q>>
    static create(x: any) {
        const modelClass = isClass(x) ? x : undefined
        const query: Query<any> = isClass(x)
            ? entityQuery(x)
            : x

        return new ActiveQuery(query, modelClass)
    }

    constructor(
        readonly query: Query<T>,
        readonly modelClass?: EntityClass<T>
    ) {
        if (modelClass != null) {
            patchQuery(query, modelClass)
        }
    }

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
            const fields = this.getConfig().fields ?? {}
            const items = Object.entries(value)
                .map(([k, v]) => {
                    const field = fields[k]
                    const column = field != null
                        ? (isDrizzleColumn(field)
                            ?  field
                            : sql.raw((Object.keys(fields).indexOf(k) + 1) + '')
                        )
                        : sql.raw(k)

                    return v === 'desc'
                        ? desc(column) : asc(column)
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

    sortableOptions(): SortableOptions<T> {
        const { modelClass } = this
        const result = modelClass != null
            ? getSortableOptions(modelClass)
            : {}

        if ((result.attributes ?? []).length == 0) {
            result.attributes = Object.keys(this.getConfig().fields ?? {}) as any
        }

        return result
    }

    async all(): Promise<T[]> {
        return this.query.execute()
    }

    async one(): Promise<T> {
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
type Executable = {
    execute(...args: any): any
}

const FLAG = Symbol('activeQuery::patchQuery')
function patchQuery<T extends Executable>(query: T, modelClass: Class): T {
    const original = query.execute
    if (original[FLAG] === undefined) {
        const execute = async (...args: any) => {
            const result = await original.call(query, ...args)
            if (Array.isArray(result) && result.length > 0) {
                const models = plainToInstance(modelClass, result)

                const entities = models.map((entry, i) => ({
                    entry,
                    data: result[i]
                }))
                await triggerOnLoad(modelClass, entities)

                return models
            }

            return result
        }

        execute[FLAG] = true
        query.execute = execute
    }

    return query
}
