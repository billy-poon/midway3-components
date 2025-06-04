import type { Table as _Table, Column, SQL, TableConfig } from 'drizzle-orm'

export type Schema = Record<string, unknown>

export type Table<T extends TableConfig = any> = _Table<T>
export type TableConfigOf<T extends Table> = T extends Table<infer P> ? P : never

export type { Column }
export type ColumnsOf<T extends Table> = TableConfigOf<T>['columns']
export type ColumnKeyOf<T extends Table> = keyof ColumnsOf<T>

export type ColumnOf<T extends Table, K extends ColumnKeyOf<T>> = ColumnsOf<T>[K]
export type ColumnConfigOf<T extends Column> = T extends Column<infer P> ? P : never

export type PrimaryKeyOf<T extends Table> = keyof {
    [K in ColumnKeyOf<T> as ColumnConfigOf<ColumnOf<T, K>>['isPrimaryKey'] extends true ? K : never]: unknown
}
export type PrimaryKeyValueOf<T extends Table> = {
    [K in PrimaryKeyOf<T>]: ColumnDataTypeOf<ColumnOf<T, K>>
}

export type ColumnDataTypeOf<T extends Column> = ColumnConfigOf<T>['data']
export type NullableColumnDataTypeOf<T extends Column> = ColumnConfigOf<T>['notNull'] extends true
    ? ColumnDataTypeOf<T>
    : ColumnDataTypeOf<T> | null

export type RowOf<T extends Table, NotNull extends boolean = false> = {
    [K in ColumnKeyOf<T>]: NotNull extends true
        ? ColumnDataTypeOf<ColumnOf<T, K>>
        : NullableColumnDataTypeOf<ColumnOf<T, K>>
}

export type ActiveRecordOf<T extends Table> = {
    readonly $row: RowOf<T> | undefined
}

export type ActiveRowOf<T, NotNull extends boolean = false> = T extends ActiveRecordOf<infer P>
    ? RowOf<P, NotNull> : never

export type SelectedFields = Record<string, Column | SQL>
export type SelectedResult<T extends SelectedFields> = {
    [K in keyof T]: T[K] extends Column
        ? NullableColumnDataTypeOf<T[K]>
        : T[K] extends SQL<infer P> ? P : never
}
