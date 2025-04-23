import { and, Column, eq, SQL } from 'drizzle-orm'
import { ActiveQuery } from './activeQuery'
import { getDataSource } from './dataSourceManager'
import { OnLoad } from './decorator/load'
import { op, Operations } from './drizzle'
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

type TableOf<T> = T extends ActiveRecordConstructor<infer P>
    ? P : never

type BuildActiveQuery<T extends ActiveRecordConstructor<any>> = (
    query: ActiveQuery<InstanceType<T>>,
    table: TableOf<T>,
    op: Operations
) => void

export interface ActiveRecordConstructor<T extends Table> {
    new (...args: any): AbstractActiveRecord<T> & RowOf<T>

    db(): Drizzle
    table(): T
    columns(): ColumnsOf<T>

    find<T extends ActiveRecordConstructor<any>>(this: T, build?: BuildActiveQuery<T>): ActiveQuery<InstanceType<T>>
    findOne<T extends ActiveRecordConstructor<any>>(this: T, where?: SQL | BuildActiveQuery<T>): Promise<InstanceType<T>>
}

export interface AbstractActiveRecord<T extends Table> {
    readonly $row?: RowOf<T>
    constructor: ActiveRecordConstructor<T>
}

@OnLoad<AbstractActiveRecord<any>>(async (x, v) => {
    await x.afterFind(v)
})
export class AbstractActiveRecord<T extends Table> {
    static db() {
        return getDataSource()
    }

    static table<T extends Table>(
        this: ActiveRecordConstructor<T>
    ): TableOf<typeof this> {
        throw new Error('Table is not provided.')
    }

    static columns<T extends Table>(
        this: ActiveRecordConstructor<T>
    ) {
        return getColumns(this.table())
    }

    static find<T extends Table>(
        this: ActiveRecordConstructor<T>,
        build?: BuildActiveQuery<typeof this>
    ) {
        const table = this.table()
        const query = this.db().select().from(table)
        const result = new ActiveQuery<InstanceType<ActiveRecordConstructor<T>>>(query as any, this as any)
        if (build != null) {
            build(result, table, op)
        }

        return result
    }

    static findOne<T extends Table>(
        this: ActiveRecordConstructor<T>,
        where?: SQL | BuildActiveQuery<typeof this>
    ) {
        const build: BuildActiveQuery<ActiveRecordConstructor<T>> = typeof where === 'function'
            ? where
            : (q) => where != null && q.where(where)

        return this.find(build).one()
    }

    pk(validate = true): PrimaryKeyOf<T> {
        const columns: Record<string, Column> = this.constructor.columns()

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

    protected createWhereFromPk() {
        const pk = this.pk()
        const table = this.constructor.table()

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

    protected async afterFind(row: RowOf<T>) {
        const $row = { ...row }
        Object.defineProperty(this, '$row', {
            get: () => $row,
            enumerable: false,
        })

        Object.assign(this, $row)

        return this
    }

    attributes() {
        const columns = this.constructor.columns()
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

    protected async beforeSave(insert: boolean) {
        return insert
            ? this.beforeInsert()
            : this.beforeUpdate()
    }

    protected async afterSave(insert: boolean, values: Partial<RowOf<T>>) {
        return insert
            ? this.afterInsert(values)
            : this.afterUpdate(values)
    }

    protected async insert() {
        const values = this.attributes()
        const ctor = this.constructor

        const db = ctor.db() as object
        const table = ctor.table() as Table

        let result: any
        if (isPostgres(db)) {
            const [row] = await db.insert(table)
                .values(values)
                .returning()
                .execute()
            result = row
        } else if (isSQLite(db)) {
            const [row] = await db.insert(table)
                .values(values)
                .returning()
                .execute()
            result = row
        } else if (isMySQL(db)) {
            const [row] =  await db.insert(table as any)
                .values(values)
                .$returningId()
                .execute()
            result = { ...values, ...row }
        } else {
            throw new Error('Unsupported database.')
        }

        await this.afterFind(result)
        await this.afterSave(true, values)

        return 1
    }

    protected async beforeInsert() {
        return true
    }

    protected async afterInsert(values: Partial<RowOf<T>>) {}

    protected async update() {
        const where = this.createWhereFromPk()
        const ctor = this.constructor

        const values = this.dirtyAttributes()
        const result = Object.keys(values).length > 0
            ? await ctor.db()
                .update(ctor.table())
                .set(values)
                .where(where)
                .execute()
            : false

        await this.afterSave(false, values)
        return this.normalizeResult(result)
    }

    protected async beforeUpdate() {
        return true
    }

    protected async afterUpdate(values: Partial<RowOf<T>>) {}

    async refresh() {
        const where = this.createWhereFromPk()
        const model = await this.constructor.findOne(where)
        await this.afterFind(model.$row as any)

        return this
    }

    async delete() {
        if (await this.beforeDelete()) {
            const where = this.createWhereFromPk()
            const ctor = this.constructor

            const result = await ctor.db()
                .delete(ctor.table())
                .where(where)
                .execute()

            await this.afterDelete()
            return this.normalizeResult(result)
        }

        return false
    }

    protected async beforeDelete() {
        return true
    }

    protected async afterDelete() {}

    protected normalizeResult(result: unknown) {
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

export function ActiveRecord<T extends Table>(table: T, dataSource?: Drizzle | string): ActiveRecordConstructor<T>
export function ActiveRecord<T extends Table>(table: T, dataSource?: Drizzle | string) {
    return class extends AbstractActiveRecord<T> {
        static db() {
            if (typeof dataSource === 'object') {
                return dataSource
            }

            return getDataSource(dataSource)
        }

        static table<T extends ActiveRecordConstructor<any>>(this: T): TableOf<T> {
            return table as any
        }
    }
}
