import { listPropertyDataFromClass, savePropertyDataToClass, savePropertyMetadata } from '@midwayjs/core'
import { Class } from '../interface'
import { getSuperClass } from '../utils'

export interface FieldOptions<T = unknown> {
    /**
     * Define the field with an alias name
     */
    name?: string
    /**
     * Define as extra field, invisible by default
     */
    extra?: boolean
    /**
     * Define a hidden field
     */
    hidden?: boolean
    /**
     * Transform before serializing, promise is supported
     * @param val the original value
     * @param definition the field definition
     */
    getValue?(val: T, definition: FieldDefinition, target: any): unknown
    /**
     * The default value of this field if `undefined`
     */
    defaultValue?: unknown
}

export interface FieldDefinition extends FieldOptions {
    /**
     * The `propertyKey` of this field
     */
    propertyKey: string | symbol,
}

const key = Symbol('decorator-key:field')
export function Field(name: string): PropertyDecorator
export function Field(extra: true): PropertyDecorator
export function Field(options?: FieldOptions): PropertyDecorator
export function Field(x?: unknown): PropertyDecorator {
    const options: FieldOptions = x == null
        ? {} : (typeof x === 'boolean'
            ? { extra: x } : (typeof x === 'object'
                ? x : { name: String(x) }
            )
        )

    return (target, propertyKey) => {
        const def: FieldDefinition = {
            ...options,
            propertyKey,
        }

        savePropertyDataToClass(key, def, target, propertyKey)
        savePropertyMetadata
    }
}

export function getFieldDefinitions(obj: object): FieldDefinition[]
export function getFieldDefinitions(clz: Class): FieldDefinition[]
export function getFieldDefinitions(x: unknown) {
    const clz: Class = typeof x === 'function'
        ? x : (x as any).constructor

    const result = listPropertyDataFromClass(key, clz) as FieldDefinition[]

    const superClz = getSuperClass(clz)
    if (superClz != null && superClz !== Object) {
        return [...getFieldDefinitions(superClz), ...result]
    }

    return result
}
