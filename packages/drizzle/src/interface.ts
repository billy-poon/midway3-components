import type { DataSourceManagerConfigOption } from '@midwayjs/core'
import type { Column, DrizzleConfig, Placeholder, SQL, TableConfig, Table as _Table } from 'drizzle-orm'
import type { DialectType } from './constants'
import type { MySQL2DataSourceOptions, MySQL2Drizzle } from './mysql/interface'
import type { PostgresDataSourceOptions, PostgresDrizzle } from './postgresql/interface'
import type { SQLiteDataSourceOptions, SQLiteDrizzle } from './sqlite/interface'

export { DialectType }

type SQLiteProtocolType = 'wss' | 'ws' | 'https' | 'http' | 'file'
type ProtocolType = Exclude<DialectType, 'sqlite'> | SQLiteProtocolType

export type Schema = Record<string, unknown>
export type DrizzleDataSourceOptions =
    | SQLiteDataSourceOptions
    | MySQL2DataSourceOptions
    | PostgresDataSourceOptions
    | (DrizzleConfig<Schema> & { connection?: `${ProtocolType}://${string}` })

export interface ConfigurationOptions {
    drizzle: DataSourceManagerConfigOption<DrizzleDataSourceOptions, never>
}

export interface Executable<T = unknown> {
    execute(): T | Promise<T>
}

export interface WhereExecutable<T = unknown> extends Executable<T> {
    where(where?: SQL): Omit<this, 'where'>
}

export type Table<T extends TableConfig = any> = _Table<T>

export type JoinType = 'left' | 'right' | 'inner'
export interface Query<T = unknown> extends Executable<T[]> {
    leftJoin: (table: Table | SQL, on: SQL) => unknown
    rightJoin: (table: Table | SQL, on: SQL) => unknown
    innerJoin: (table: Table | SQL, on: SQL) => unknown

    where(where?: SQL): any
    limit(limit: number | Placeholder): any
    offset(offset: number | Placeholder): any
    orderBy(...items: SQL[]): any
}

export type QueryResult<T extends Query> = T extends Query<infer P>
    ? P extends object
        ? P : never
    : never


type SelectedFields = Record<string, Column | SQL>
type SelectResult<T extends SelectedFields> = {
    [K in keyof T]: T[K] extends Column
        ? NullableColumnDataTypeOf<T[K]>
        : T[K] extends SQL<infer P>
            ? P : never
}
type SelectBuilder<T extends SelectedFields | undefined> = {
    from<TTable extends Table>(table: TTable): Query<
        T extends SelectedFields
            ? SelectResult<T>
            : RowOf<TTable>
    >
}

type InsertBuilder<T extends Table> = {
    values(values: Partial<RowOf<T>>): Executable
}

type UpdateBuilder<T extends Table> = {
    set(values: Partial<RowOf<T>>): WhereExecutable
}

type DeleteCommand = WhereExecutable

export interface Drizzle {
    readonly $client: {
        end?(): unknown
        close?(): unknown
        connect?(): unknown
    }
    select(): SelectBuilder<undefined>
    select<T extends SelectedFields>(fields: T): SelectBuilder<T>
    insert<T extends Table>(table: T): InsertBuilder<T>
    update<T extends Table>(table: T): UpdateBuilder<T>
    delete<T extends Table>(table: T): DeleteCommand
}

export type {
    SQLiteDrizzle as LibSQLDrizzle,
    MySQL2Drizzle,
    PostgresDrizzle
}

export type TableConfigOf<T extends Table> = T extends Table<infer P> ? P : never

export type ColumnsOf<T extends Table> = TableConfigOf<T>['columns']
export type ColumnKeyOf<T extends Table> = keyof ColumnsOf<T>

export type ColumnOf<T extends Table, K extends ColumnKeyOf<T>> = ColumnsOf<T>[K]
export type ColumnConfigOf<T extends Column> = T extends Column<infer P> ? P : never

export type ColumnDataTypeOf<T extends Column> = ColumnConfigOf<T>['data']
export type NullableColumnDataTypeOf<T extends Column> = ColumnConfigOf<T>['notNull'] extends true
    ? ColumnDataTypeOf<T>
    : ColumnDataTypeOf<T> | null

export type RowOf<T extends Table, notNull extends boolean = false> = {
    [K in ColumnKeyOf<T>]: notNull extends true
    ? ColumnDataTypeOf<ColumnOf<T, K>>
    : NullableColumnDataTypeOf<ColumnOf<T, K>>
}

export type PrimaryKeyOf<T extends Table> = {
    [K in ColumnKeyOf<T>]: ColumnConfigOf<ColumnOf<T, K>>['isPrimaryKey'] extends true
    ? ColumnDataTypeOf<ColumnOf<T, K>>
    : never
}

export interface MySQLExecuteResult {
    info: string
    insertId: number
    fieldCount: number
    affectedRows: number
    changedRows: number
    warningStatus: number
    serverStatus: number
}

export interface PgExecuteResult {
    command: string
    rowCount: number
    oid: unknown
    rows: unknown[]
    fields: unknown[]
    RowCtor: unknown
    rowAsArray: boolean
}

export interface SQLiteExecuteResult {
    columns: unknown[]
    columnTypes: unknown[]
    rows: unknown[]
    rowsAffected: number
    lastInsertRowid: string
}
