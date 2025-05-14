import { SQL, DrizzleConfig as _DrizzleConfig } from 'drizzle-orm'
import * as op from 'drizzle-orm/sql/expressions/conditions'
import { MySQL2DataSourceOptions, PostgresDataSourceOptions, ProtocolType, SQLiteDataSourceOptions } from './dialects'
import { Query } from './query'
import { RowOf, Schema, SelectedFields, SelectedResult, Table } from './types'

export { op }
export type Operations = typeof op

export type DrizzleConfig<T extends Schema = Schema> = _DrizzleConfig<T>

export type DrizzleDataSourceOptions =
    | SQLiteDataSourceOptions
    | MySQL2DataSourceOptions
    | PostgresDataSourceOptions
    | (DrizzleConfig & { connection?: `${ProtocolType}://${string}` })

export interface Executable<T = unknown> {
    execute(): T | Promise<T>
}

export interface ExecutableConditional<T = unknown> extends Executable<T> {
    where(where?: SQL): Omit<this, 'where'>
}

export type QueryResultOf<T extends Query> = T extends Query<infer P>
    ? P extends object
    ? P : never
    : never

export type SelectBuilder<T extends SelectedFields | undefined> = {
    from<TTable extends Table>(table: TTable): Query<
        T extends SelectedFields
            ? SelectedResult<T> : RowOf<TTable>
    >
}

export type InsertBuilder<T extends Table> = {
    values(values: Partial<RowOf<T>>): Executable
}

export type UpdateBuilder<T extends Table> = {
    set(values: Partial<RowOf<T>>): ExecutableConditional
}

export type DeleteCommand = ExecutableConditional

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
