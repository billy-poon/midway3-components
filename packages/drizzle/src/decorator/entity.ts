import { Class, DecoratorKey, getSuperClass } from '@midway3-components/core'
import { getClassMetadata, listPropertyDataFromClass, saveClassMetadata, savePropertyDataToClass } from '@midwayjs/core'
import { Transform } from 'class-transformer'
import { Column as DrizzleColumn, SQL } from 'drizzle-orm'
import { Drizzle } from '../drizzle'
import type { From, JoinType } from '../query'
import { OnLoad, OnLoadCallback } from './onLoad'

type Join = {
    type?: JoinType
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

type EntityMeta = {
    from: From
    options?: EntityOptions
}

const entityKey: DecoratorKey<EntityMeta>
    = '@midway3-components/drizzle:decorator:entity'
export function Entity<T extends BaseEntity = any>(from: From, options?: EntityOptions<T>): ClassDecorator {
    return (target) => {
        saveClassMetadata(entityKey, { from, options }, target)
        const { onLoad } = options ?? {}
        if (onLoad != null) {
            OnLoad(onLoad)(target)
        }
    }
}

export function isEntityClass(clz: Class) {
    return getEntityMeta(clz) != null
}

export function getEntityMeta(clz: Class): EntityMeta | null {
    const result = getClassMetadata(entityKey, clz)
    if (result == null) {
        const superClz = getSuperClass(clz)
        if (superClz != null) {
            return getEntityMeta(superClz)
        }
    }

    return result ?? null
}

type ReadValue<T> = (val: any, key: string | symbol, entity: T) => unknown
export type ColumnOptions<T = any> = {
    nullValue?: unknown
    readValue?: ReadValue<T>
}

type ColumnMeta = {
    column: EntityColumn
    propertyKey: string
    options?: ColumnOptions
}

const columnKey: DecoratorKey<ColumnMeta>
    = '@midway3-components/drizzle:decorator:column'

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

export function getColumnsMeta(clz: Class): ColumnMeta[] {
    const result = listPropertyDataFromClass(columnKey, clz)

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
    const meta = getEntityMeta(clz)
    if (meta == null) {
        throw new Error(`Class \`${clz.name}\` is not defined as entity.`)
    }

    const columns = getColumnsMeta(clz)
    if (columns.length < 1) {
        throw new Error(`No column defined for entity \`${clz.name}\`.`)
    }

    return {
        ...meta,
        columns
    }
}
