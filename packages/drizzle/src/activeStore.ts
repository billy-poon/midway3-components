import { Awaitable, DataStore, isPlainObject, QueryInterface } from '@midway3-components/core'
import { ActiveRecordConstructor } from './activeRecord'

export class ActiveStore<T extends ActiveRecordConstructor> implements DataStore<InstanceType<T>> {
    constructor(
        protected readonly modelClass: T
    ) {}

    query(): QueryInterface<InstanceType<T>> {
        return this.modelClass.find()
    }

    init(): Awaitable<InstanceType<T>> {
        return new this.modelClass() as InstanceType<T>
    }

    get(cond: unknown): Awaitable<InstanceType<T> | null> {
        let where: object
        if (isPlainObject(cond)) {
            where = cond
        } else {
            const columns = Object.entries(this.modelClass.columns())
                .map(([k, v]) => ({ ...v, propertyKey: k }))

            let primaryColumns = columns.filter(x => x.primary)
            if (primaryColumns.length < 1) {
                const idColumnName = this.idPropertyName()
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

        return this.modelClass.findOne(where)
    }

    protected idPropertyName() {
        return 'id'
    }

    async save(data: InstanceType<T>) {
        await data.save()
        return data
    }

    async delete(data: InstanceType<T>) {
        await data.delete()
    }
}

export function createActiveStore<T extends ActiveRecordConstructor>(modelClass: T) {
    return new ActiveStore(modelClass)
}
