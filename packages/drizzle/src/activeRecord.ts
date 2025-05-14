import { configure } from '@midway3-components/core'
import { and, Column, eq, getTableColumns } from 'drizzle-orm'
import { ActiveQuery, Condition } from './activeQuery'
import { getDataSource } from './dataSourceManager'
import { OnLoad } from './decorator/load'
import { isMySQL, isMySQLResult, isPostgres, isPostgresResult, isSQLite, isSQLiteResult } from './dialects'
import { Drizzle, op, Operations } from './drizzle'
import { ActiveRecordOf, ColumnKeyOf, ColumnsOf, PrimaryKeyValueOf, RowOf, Table } from './types'

type TableOf<T> = T extends ActiveRecordConstructor<infer P>
    ? P : never

type BuildQuery<T extends ActiveRecordConstructor> = (
    query: ActiveQuery<InstanceType<T>>,
    table: TableOf<T>,
    // eslint-disable-next-line no-shadow
    op: Operations
) => void

type ActiveCondition<T extends ActiveRecordConstructor> =
    | BuildQuery<T>
    | Condition<InstanceType<T>>

function normalizeCondition<T extends ActiveRecordConstructor>(val: ActiveCondition<T>): BuildQuery<T> {
    return typeof val === 'function'
        ? val
        : q => q.where(val as any)
}

export interface ActiveRecordConstructor<T extends Table = any> {
    new (...args: any): AbstractActiveRecord<T> & RowOf<T>

    db(): Drizzle
    table(): T
    columns(): ColumnsOf<T>

    find<C extends ActiveRecordConstructor>(this: C, build?: BuildQuery<C>): ActiveQuery<InstanceType<C>>

    findOne<C extends ActiveRecordConstructor>(this: C, condition?: ActiveCondition<C>): Promise<InstanceType<C> | null>
    findOne<C extends ActiveRecordConstructor>(this: C, condition: ActiveCondition<C> | undefined | null, required: true): Promise<InstanceType<C>>

    findAll<C extends ActiveRecordConstructor>(this: C, condition?: ActiveCondition<C>): Promise<InstanceType<C>[]>
}

export interface AbstractActiveRecord<T extends Table> extends ActiveRecordOf<T> {
    constructor: ActiveRecordConstructor<T>
}

@OnLoad<AbstractActiveRecord<any>>(async (x, v) => {
    await x.afterFind(v)
})
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class AbstractActiveRecord<T extends Table> {
    static db() {
        return getDataSource()
    }

    static table<K extends Table>(
        this: ActiveRecordConstructor<K>
    ): TableOf<typeof this> {
        throw new Error('Table is not provided.')
    }

    static columns<K extends Table>(
        this: ActiveRecordConstructor<K>
    ) {
        return getTableColumns(this.table())
    }

    static find<K extends Table>(
        this: ActiveRecordConstructor<K>,
        build?: BuildQuery<typeof this>
    ) {
        const table = this.table()
        const query = this.db().select().from(table)
        const result = new ActiveQuery<InstanceType<typeof this>>(query as any, this)
        if (build != null) {
            build(result, table, op)
        }

        return result
    }

    static async findOne<K extends Table>(
        this: ActiveRecordConstructor<K>,
        condition?: ActiveCondition<typeof this>,
        required?: boolean
    ) {
        const build = condition != null
            ? normalizeCondition(condition)
            : undefined

        const result = await this.find(build).one()
        if (result == null && required) {
            throw new Error('Object not found.')
        }

        return result
    }

    static async findAll<K extends Table>(
        this: ActiveRecordConstructor<K>,
        condition?: ActiveCondition<typeof this>
    ) {
        const build = condition != null
            ? normalizeCondition(condition)
            : undefined

        const result = await this.find(build).all()
        return result
    }

    pk(validate = true): PrimaryKeyValueOf<T> {
        const columns: Record<string, Column> = this.constructor.columns()

        const result = Object.entries(columns)
            .reduce(
                (res, [k, v]) => {
                    if (v.primary) {
                        res[k] = this.$row?.[k]
                    }
                    return res
                },
                {} as Record<string, unknown>
            ) as PrimaryKeyValueOf<T>

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
        return this.configureRow(row)
    }

    configureRow(row: RowOf<T>): this
    configureRow(row: Partial<RowOf<T>>, merge: true): this
    configureRow(row: Partial<RowOf<T>>, merge?: boolean) {
        const $row = merge
            ? { ...this.$row, ...row }
            : { ...row }

        Object.defineProperty(this, '$row', {
            get: () => $row,
            enumerable: false,
            configurable: true,
        })

        return this.configure($row)
    }

    configure(data: Partial<RowOf<T>>) {
        return configure(this, data as Partial<this>)
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

        this.configureRow(result)
        await this.afterSave(true, values)

        return 1
    }

    protected async beforeInsert() {
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

        this.configureRow(values, true)
        await this.afterSave(false, values)
        return this.normalizeResult(result)
    }

    protected async beforeUpdate() {
        return true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async afterUpdate(values: Partial<RowOf<T>>) {}

    async refresh() {
        const where = this.createWhereFromPk()
        const model = await this.constructor.findOne(where)
        if (model == null) {
            throw new Error('Object not found.')
        }
        this.configureRow(model.$row!)

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

        static table() {
            return table as any
        }
    }
}
