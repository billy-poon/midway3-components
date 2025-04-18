import { isPromise } from '@midwayjs/core/dist/util/types'
import { Class } from './interface'

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

export function configure<T>(target: T, values: Partial<T>) {
    Object.entries(values)
        .forEach(([k, v]) => {
            if (v !== undefined) {
                target[k] = v
            }
        })

    return target
}

export function getSuperClass(clz: Class, until = Object): Class | null {
    if (clz?.prototype != null) {
        const result = Object.getPrototypeOf(clz.prototype)?.constructor ?? null
        if (result !== until) {
            return result
        }
    }

    return null
}

type AsyncMapFn<T, U> = (v: T, i: number) => Promise<U>
export async function asyncMap<T, U>(items: T[], cb: AsyncMapFn<T, U>, concurrent = false) {
    if (concurrent) {
        return Promise.all(items.map(async (x, i) => cb(x, i)))
    }

    let index = 0
    let result: U[] = []
    for (const x of items) {
        const item = await cb(x, index++)
        result.push(item)
    }

    return result
}
