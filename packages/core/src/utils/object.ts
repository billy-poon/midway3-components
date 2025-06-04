import { isPromise } from '@midwayjs/core/dist/util/types'
import { KeyOf, PartialData } from '../interface'

// https://developer.mozilla.org/en-US/docs/Glossary/Primitive
const primitiveTypes = [
    'string', 'number', 'bigint', 'boolean',
    'undefined', 'symbol', 'null',
]
export function isPrimitive(val: unknown) :
    val is string | number | bigint | boolean | undefined | symbol | null
{
    if (val != null) {
        return primitiveTypes.includes(typeof val)
    }

    return true
}

export function deepClone<T>(val: T): T {
    if (isPromise(val) || typeof val === 'function') {
        return val
    }

    if (Array.isArray(val)) {
        return val.map(x => deepClone(x)) as T
    }

    return Object.entries(val ?? {})
        .reduce(
            (res, [k, v]) => (res[k] = deepClone(v), res),
            {} as T
        )
}

const hasReflectKeys = typeof Reflect?.ownKeys === 'function'

export function getKeys<T>(val: T): KeyOf<T>[]
export function getKeys<T>(val: T) {
    if (val == null) {
        return []
    } else if (typeof val === 'object' && hasReflectKeys) {
        return Reflect.ownKeys(val)
    }

    return Object.keys(val)
}

export function getValues<T>(val: T) {
    return getEntries(val)
        .map(([, v]) => v)
}

export function getEntries<T>(val: T) {
    const keys = getKeys(val)
    return keys.map(k => [k, val[k as any]] as const)
}

export function configure<T>(target: T, data: PartialData<T>) {
    Object.entries(data)
        .forEach(([k, v]) => {
            if (v !== undefined && typeof v !== 'function') {
                target[k] = v
            }
        })

    return target
}
