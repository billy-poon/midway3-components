import { Class, getSuperClass } from '@midway3-components/data'
import { getClassMetadata, listPropertyDataFromClass, saveClassMetadata, savePropertyDataToClass } from '@midwayjs/core'
import { Transform } from 'class-transformer'
import { Column as DrizzleColumn, SQL, Table } from 'drizzle-orm'
import { Drizzle } from '../interface'
import { OnLoad, OnLoadCallback } from './load'

type From = Table
type Join = {
    type?: 'left' | 'right' | 'inner'
    from: From
    on: SQL
}

type BaseEntity = object
export type EntityClass<T extends BaseEntity = any> = Class<T, []>

export type EntityOptions<T = any> = {
    joins?: Join[]
    onLoad?: OnLoadCallback<T>
    dataSource?: Drizzle | string
}

const entityKey = Symbol('@midway3-components/drizzle:decorator:entity')
export function Entity<T extends BaseEntity = any>(from: From, options?: EntityOptions<T>): ClassDecorator {
    return (target) => {
        saveClassMetadata(entityKey, { from, options }, target)
        const { onLoad } = options ?? {}
        if (onLoad != null) {
            OnLoad(onLoad)(target)
        }
    }
}

type EntityMeta = {
    from: From
    options?: EntityOptions
}

export function getEntityMeta(clz: Class): EntityMeta | null {
    const result: EntityMeta = getClassMetadata(entityKey, clz)
    if (result == null) {
        const superClz = getSuperClass(clz)
        if (superClz != null) {
            return getEntityMeta(superClz)
        }
    }

    return result ?? null
}

export function isEntityClass(clz: Class) {
    return getEntityMeta(clz) != null
}

type ReadValue<T> = (val: any, key: string | symbol, entity: T) => unknown
export type ColumnOptions<T = any> = {
    nullValue?: unknown
    readValue?: ReadValue<T>
}

const columnKey = Symbol('@midway3-components/drizzle:decorator:column')

type EntityColumn = DrizzleColumn | SQL
export function Column<T extends BaseEntity = any>(column: EntityColumn, options?: ColumnOptions<T>): PropertyDecorator
export function Column<T extends BaseEntity = any>(column: EntityColumn, readValue: ReadValue<T>): PropertyDecorator
export function Column(column: EntityColumn, y?: ColumnOptions | ReadValue<any>): PropertyDecorator {
    const options = typeof y === 'function'
        ? { readValue: y }
        : y

    return (target, propertyKey) => {
        if (typeof propertyKey !== 'string') {
            throw new Error('Non-string key is not supported.')
        }

        savePropertyDataToClass(columnKey, { column, propertyKey, options }, target, propertyKey)
        const { nullValue = null, readValue } = options ?? {}

        type Arguments<T> = T extends (...args: infer P) => any ? P : never

        const transformFn: Arguments<typeof Transform>[0] = readValue != null
            ? ({ value, key, obj }) => readValue(value, key, obj)
            : ({ value }) => value ?? nullValue

        Transform(transformFn, { toClassOnly: true })(target, propertyKey)
    }
}

type ColumnMeta = {
    column: EntityColumn
    propertyKey: string
    options?: ColumnOptions
}

export function getColumnsMeta(clz: Class): ColumnMeta[] {
    const result: ColumnMeta[] = listPropertyDataFromClass(columnKey, clz)

    const superClz = getSuperClass(clz)
    if (superClz != null) {
        return [
            ...getColumnsMeta(superClz),
            ...result
        ]
    }

    return result
}

export function getEntityDefinition(clz: Class) {
    const { from, ...rest } = getEntityMeta(clz) ?? {}
    if (from == null) {
        throw new Error(`Class \`${clz.name}\` is not defined as entity.`)
    }

    const columns = getColumnsMeta(clz)
    if (columns.length < 1) {
        throw new Error(`No column defined for entity \`${clz.name}\`.`)
    }

    return {
        from,
        ...rest,
        columns
    }
}
