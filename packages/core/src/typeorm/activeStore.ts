import { Model } from 'sequelize'
import { IsNull, ObjectLiteral, RemoveOptions, Repository, SaveOptions } from 'typeorm'
import { QueryInterface } from '../data'
import { DataStore } from '../data/dataStore'
import { Awaitable } from '../interface'
import { isPlainObject } from '../utils'
import { ActiveQuery } from './activeQuery'

export class ActiveStore<T extends ObjectLiteral> implements DataStore<T> {
    constructor(
        protected readonly repository: Repository<T>
    ) {}

    query(): QueryInterface<T> {
        return ActiveQuery.create(this.repository)
    }

    init(): Awaitable<T> {
        return this.repository.create()
    }

    get(cond: unknown): Awaitable<T | null> {
        let where: object
        if (isPlainObject(cond)) {
            where = cond
        } else {
            const meta = this.repository.metadata
            let primaryColumns = meta.columns.filter(x => x.isPrimary)
            if (primaryColumns.length < 1) {
                const idColumnName = this.idPropertyName()
                if (idColumnName != null) {
                    const idColumn = meta.columns.find(x => x.propertyName === idColumnName)
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
                (res, x, i) => (res[x.propertyName] = primaryValues[i], res),
                {}
            )
        }

        const items = Object.entries(where)
        if (items.length < 1) {
            throw new Error('Empty condition is not supported.')
        }

        items.forEach(([k, v]) => {
            if (v == null) {
                where[k] = IsNull()
            }
        })

        return this.repository.findOneBy(where)
    }

    protected idPropertyName(): string | undefined {
        return 'id'
    }

    save(data: T): Awaitable<T> {
        const options = this.saveOptions()
        return this.repository.save(data, options)
    }

    saveOptions(): SaveOptions | undefined {
        return
    }

    async delete(data: T) {
        const options = this.removeOptions()
        await this.repository.remove(data, options)
    }

    removeOptions(): RemoveOptions | undefined {
        return
    }
}

export function createActiveStore<T extends Model>(repository: Repository<T>) {
    return new ActiveStore(repository)
}
