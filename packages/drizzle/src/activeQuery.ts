import { Class, configure, getSortableOptions, QueryInterface, SortableOptions } from '@midway3-components/core'
import { ORDER } from '@midway3-components/core/dist/data'
import { isClass } from '@midwayjs/core/dist/util/types'
import { plainToInstance } from 'class-transformer'
import { and, asc, desc, eq, isNull, isSQLWrapper, SQL, sql } from 'drizzle-orm'
import { EntityClass } from './decorator/entity'
import { triggerOnLoad } from './decorator/onLoad'
import { createQuery, Query, QueryConfig, QueryResultOf, QuerySession } from './query'
import { ActiveRecordOf, RowOf, SelectedFields } from './types'
import { isDrizzleColumn } from './utils'

export type Condition<T extends object> =
    | SQL
    | Partial<
        T extends ActiveRecordOf<infer P> ? RowOf<P> : T
    >

function buildCondition(data: object, fields: SelectedFields): SQL | undefined {
    const items = Object.entries(data)
        .map(([k, v]) => {
            const column = fields[k]
            if (isDrizzleColumn(column)) {
                return v == null
                    ? isNull(column)
                    : eq(column, v)
            }
            throw new Error('Property is not bound to a table column: ' + k)
        })

    return and(...items)
}

export class ActiveQuery<T extends object> implements QueryInterface<T> {
    static create<M extends object>(entityClz: EntityClass<M>): ActiveQuery<Query<M>>
    static create<Q extends Query<object>>(query: Q): ActiveQuery<QueryResultOf<Q>>
    static create(x: any) {
        const modelClass = isClass(x) ? x : undefined
        const query: Query<any> = isClass(x)
            ? createQuery(x)
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
        const result = this.query['config']
        if (typeof result !== 'object') {
            throw new Error('Failed to resolve query[config].')
        }

        return result
    }

    protected setConfig(val: Partial<QueryConfig>) {
        configure(this.getConfig(), val)
    }

    where(condition: Condition<T> | null): this {
        const where = condition == null
            ? undefined : (
                isSQLWrapper(condition)
                    ? (condition as SQL)
                    : buildCondition(condition, this.getConfig().fields)
        )

        this.query.where(where)
        return this
    }

    limit(value: number | null): this {
        if (value != null) {
            this.query.limit(value)
        } else {
            this.setConfig({ limit: undefined })
        }
        return this
    }

    offset(value: number | null): this {
        if (value != null) {
            this.query.offset(value)
        } else {
            this.setConfig({ offset: undefined })
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
            this.setConfig({ orderBy: undefined })
        }

        return this
    }

    addOrderBy(value: Record<string, ORDER>): this {
        const getOrderBy = () => this.getConfig().orderBy ?? []

        const items = getOrderBy()
        this.orderBy(value)

        this.setConfig({
            orderBy: [...items, ...getOrderBy()]
        })

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

    async one(): Promise<T | null> {
        const [row] = await this.limit(1).all()
        return row ?? null
    }

    protected getSession(): QuerySession {
        const result = this.query['session']
        if (typeof result !== 'object') {
            throw new Error('Failed to resolve query[session].')
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

const FLAG = Symbol('@midway3-components/core:ActiveQuery::patchQuery')
function patchQuery<T extends Executable>(query: T, modelClass: Class): T {
    const original = query.execute
    if (original[FLAG] === undefined) {
        const execute = async (...args: any) => {
            const result = await original.call(query, ...args)
            if (Array.isArray(result) && result.length > 0) {
                const items = plainToInstance(modelClass, result)
                    .map((entity, i) => ({
                        entity,
                        data: result[i]
                    }))

                const array = await triggerOnLoad(modelClass, items)
                return (array ?? items).map(x => x.entity)
            }

            return result
        }

        execute[FLAG] = true
        query.execute = execute
    }

    return query
}
