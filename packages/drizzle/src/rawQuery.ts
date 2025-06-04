import { sql, SQL, SQLWrapper } from 'drizzle-orm'
import { getDataSource } from './dataSourceManager'
import { Drizzle } from './drizzle'
import { From } from './query'
import { SelectedFields } from './types'

export class RawQuery<TSelectedFields extends SelectedFields> implements SQLWrapper {
    constructor(
        protected selects: TSelectedFields,
        protected from?: From,
    ) {
    }

    column<K extends keyof TSelectedFields>(name: K): TSelectedFields[K] {
        return this.selects[name]
    }

    private _alias?: string
    alias(val: string) {
        this._alias = val
        return this
    }

    prepare(dataSource?: Drizzle | string) {
        const { selects, from } = this
        if (from == null) {
            throw new Error('Can\'t prepare a raw-query without `from` clause.')
        }

        const drizzle = typeof dataSource === 'object'
            ? dataSource : getDataSource(dataSource)

        return drizzle.select(selects).from(from)
    }

    getSQL(): SQL {
        const { selects, from, _alias: alias } = this
        const items = Object.entries(selects)
        if (items.length < 1) {
            throw new Error('Empty selection is not supported.')
        }

        const fields = sql.join(items.map(([k, v]) => {
            return v.getSQL().as(k).getSQL
        }), sql`,`)
        const result = sql`select ${fields}`

        if (from != null) {
            result.append(sql` from ${from}`)
        }

        return alias
            ? result.as(alias).getSQL()
            : result
    }
}

export function rawQuery<TSelectedFields extends SelectedFields>(selects: TSelectedFields, from?: From) {
    return new RawQuery(selects, from)
}
