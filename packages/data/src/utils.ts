import { Class } from './interface'

// https://developer.mozilla.org/en-US/docs/Glossary/Primitive
const primitiveTypes = [
    'string', 'number', 'bigint', 'boolean',
    'undefined', 'symbol', 'null',
]
export function isPrimitive(val: unknown) {
    if (val != null) {
        return primitiveTypes.includes(typeof val)
    }

    return true
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

export function getSuperClass(clz: Class): Class | null {
    if (clz?.prototype != null) {
        return Object.getPrototypeOf(clz.prototype)?.constructor ?? null
    }

    return null
}
