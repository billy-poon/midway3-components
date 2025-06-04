import { Model } from 'sequelize'
import { DataStore, QueryInterface } from '../data'
import { Awaitable, Class } from '../interface'
import { isPlainObject } from '../utils'
import { ActiveQuery } from './activeQuery'
import { ModelConstructor } from './types'

export class ActiveStore<T extends Model> implements DataStore<T> {
    constructor(
        protected modelClass: ModelConstructor<T>
    ) {}

    query(): QueryInterface<T> {
        return ActiveQuery.create(this.modelClass)
    }

    init(): Awaitable<T> {
        const modelClass = this.modelClass as Class<T>
        return new modelClass()
    }

    get(cond: unknown): Awaitable<T> {
        let where: object
        if (isPlainObject(cond)) {
            where = cond
        } else {
            const columns = Object.entries(this.modelClass.getAttributes())
                .map(([k, v]) => ({ ...v, propertyKey: k }))

            let primaryColumns = columns.filter(x => x.primaryKey)
            if (primaryColumns.length < 1) {
                const idColumnName = this.idAttributeName()
                if (idColumnName != null) {
                    const idColumn = columns.find(x => x.propertyKey === idColumnName)
                    if (idColumn != null) {
                        primaryColumns = [idColumn]
                    }
                }
            }

            const primaryValues = Array.isArray(cond) ? cond : [cond]
            if (primaryColumns.length !== primaryValues.length) {
                throw new Error('Primary key values count doesn\'t matched.')
            }

            where = primaryColumns.reduce<Record<string, unknown>>(
                (res, x, i) => (res[x.propertyKey] = primaryValues[i], res),
                {}
            )
        }

        const items = Object.entries(where)
        if (items.length < 1) {
            throw new Error('Empty condition is not supported.')
        }

        items.forEach(([k, v]) => {
            if (v == null) {
                where[k] = null
            }
        })

        return this.modelClass.findOne({ where: where as any }) as any
    }

    protected idAttributeName() {
        return 'id'
    }

    save(data: T): Awaitable<T> {
        return data.save()
    }

    delete(data: T): Awaitable<void> {
        return data.destroy()
    }
}

export function createActiveStore<T extends Model>(modelClass: ModelConstructor<T>) {
    return new ActiveStore(modelClass)
}
