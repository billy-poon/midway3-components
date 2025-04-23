import { Class } from '@midway3-components/core'
import { and, Column, eq, SQL } from 'drizzle-orm'
import { ActiveQuery } from './activeQuery'
import { getDataSource } from './dataSourceManager'
import { OnLoad } from './decorator/load'
import { ColumnKeyOf, ColumnsOf, Drizzle, PrimaryKeyOf, RowOf, Table } from './interface'
import { isDrizzleColumn, isMySQL, isMySQLResult, isPostgres, isPostgresResult, isSQLite, isSQLiteResult } from './utils'

function getColumns<T extends Table>(table: T) {
    return Object.entries(table)
        .reduce(
            (res, [k, v]) => {
                if (isDrizzleColumn(v)) {
                    res[k as ColumnKeyOf<T>] = v as any
                }
                return res
            },
            {} as ColumnsOf<T>
        )
}

type TableOf<T> = T extends Class<AbstractActiveRecord<infer P>>
    ? P : never

@OnLoad<AbstractActiveRecord<any>>(async (x, v) => {
    await x.afterFind(v)
})
class AbstractActiveRecord<T extends Table> {
    $row?: RowOf<T>

    static db() {
        return getDataSource()
    }

    static table<T extends typeof AbstractActiveRecord>(this: T): TableOf<T> {
        throw new Error('Table is not provided.')
    }

    static columns<T extends typeof AbstractActiveRecord>(this: T) {
        return getColumns(this.table())
    }

    static find<T extends typeof AbstractActiveRecord>(this: T, build?: (query: ActiveQuery<InstanceType<T>>, table: TableOf<T>) => void) {
        const table = this.table()
        const query = this.db().select().from(table)
        const result = new ActiveQuery<InstanceType<T>>(query as any, this as any)
        if (build != null) {
            build(result, table)
        }

        return result
    }

    static findOne<T extends typeof AbstractActiveRecord>(this: T, where: SQL) {
        return this.find().where(where).one()
    }

    pk(validate = true): PrimaryKeyOf<T> {
        const columns: Record<string, Column>
            = (this.constructor as typeof AbstractActiveRecord).columns()
        const result = Object.entries(columns)
            .reduce(
                (res, [k, v]) => {
                    if (v.primary) {
                        res[k] = this[k]
                    }
                    return res
                },
                {} as Record<string, unknown>
            ) as PrimaryKeyOf<T>

        if (validate) {
            const items = Object.entries(result)
            if (items.length < 1) {
                throw new Error('Primary key is not defined.')
            } else {
                items.forEach(([k, v]) => {
                    if (v == null) {
                        throw new Error('Primary key value is not set: ' + k)
                    }
                })
            }
        }

        return result
    }

    createWhereFromPk() {
        const pk = this.pk()

        const ctor = this.constructor as typeof AbstractActiveRecord
        const table = ctor.table()

        const result = and(
            ...Object.entries(pk)
                .map(([k, v]) => eq(table[k], v))
        )
        if (result == null) {
            throw new Error('Failed to resolve primary key.')
        }

        return result
    }

    isNew() {
        return this.$row == null
    }

    /** @protected */
    async afterFind(row: RowOf<T>) {
        this.$row = row
        Object.assign(this, row)

        return this
    }

    attributes() {
        const columns = (this.constructor as typeof AbstractActiveRecord).columns()
        return Object.entries(columns)
            .reduce(
                (res, [k]) => (res[k] = this[k], res),
                {} as Record<string, unknown>
            ) as Partial<RowOf<T>>
    }

    dirtyAttributes() {
        const result = this.attributes()

        const row = this.$row
        if (row == null) {
            return result
        }

        return Object.entries(result)
            .reduce(
                (res, [k, v]) => {
                    if (row[k] != v) {
                        res[k as ColumnKeyOf<T>] = v
                    }
                    return res
                },
                {} as Partial<RowOf<T>>
            )
    }

    async save() {
        const insert = this.isNew()
        if (!await this.beforeSave(insert)) {
            return false
        }
        return insert ? this.insert() : this.update()
    }

    /** @protected */
    async beforeSave(insert: boolean) {
        return insert
            ? this.beforeInsert()
            : this.beforeUpdate()
    }

    async afterSave(insert: boolean, values: Partial<RowOf<T>>) {
        return insert
            ? this.afterInsert(values)
            : this.afterUpdate(values)
    }

    /** @protected */
    async insert() {
        const values = this.attributes()
        const ctor = this.constructor as typeof AbstractActiveRecord

        let result: any
        const db = ctor.db() as object
        if (isPostgres(db)) {
            const [row] = await db.insert(ctor.table())
                .values(values)
                .returning()
                .execute()
            result = row
        } else if (isSQLite(db)) {
            const [row] = await db.insert(ctor.table())
                .values(values)
                .returning()
                .execute()
            result = row
        } else if (isMySQL(db)) {
            const [row] =  await db.insert(ctor.table() as any)
                .values(values)
                .$returningId()
                .execute()
            result = { ...values, ...row }
        } else {
            throw new Error('Unsupported database.')
        }

        await this.afterFind(result)
        await this.afterSave(true, values)

        return this.normalizeResult(result)
    }

    /** @protected */
    async beforeInsert() {
        return true
    }

    /** @protected */
    async afterInsert(values: Partial<RowOf<T>>) {}

    /** @protected */
    async update() {
        const where = this.createWhereFromPk()
        const ctor = this.constructor as typeof AbstractActiveRecord

        const values = this.dirtyAttributes()
        let result = Object.keys(values).length > 0
            ? await ctor.db()
                .update(ctor.table())
                .set(values)
                .where(where)
                .execute()
            : false

        await this.afterSave(false, values)
        return this.normalizeResult(result)
    }

    /** @protected */
    async beforeUpdate() {
        return true
    }

    /** @protected */
    async afterUpdate(values: Partial<RowOf<T>>) {}

    async refresh() {
        const where = this.createWhereFromPk()
        const ctor = this.constructor as typeof AbstractActiveRecord
        const model = await ctor.findOne(where)
        await this.afterFind(model.$row as any)

        return this
    }

    async delete() {
        if (await this.beforeDelete()) {
            const where = this.createWhereFromPk()
            const ctor = this.constructor as typeof AbstractActiveRecord
            let result = await ctor.db()
                .delete(ctor.table())
                .where(where)
                .execute()

            await this.afterDelete()
            return this.normalizeResult(result)
        }

        return false
    }

    /** @protected */
    async beforeDelete() {
        return true
    }

    /** @protected */
    async afterDelete() {}

    normalizeResult(result: unknown) {
        const item = Array.isArray(result)
            ? result[0] : result

        if (isPostgresResult(item)) {
            return item.rowCount
        } else if (isMySQLResult(item)) {
            return item.affectedRows
        } else if (isSQLiteResult(item)) {
            return item.rowsAffected
        }

        return result
    }
}

export function ActiveRecord<T extends Table>(table: T, dataSource?: Drizzle | string) {
    const result = class extends AbstractActiveRecord<T> {
        static db() {
            if (typeof dataSource === 'object') {
                return dataSource
            }

            return getDataSource(dataSource)
        }

        static table() {
            return table as any
        }
    }
    return result as typeof result & (new (...args: any) => InstanceType<typeof result> & RowOf<T>)
}
