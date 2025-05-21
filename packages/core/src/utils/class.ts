import { Class } from '../interface'

export function getSuperClass(clz: Class, until = Object): Class | null {
    if (clz?.prototype != null) {
        const result = Object.getPrototypeOf(clz.prototype)?.constructor ?? null
        if (result !== until) {
            return result
        }
    }

    return null
}


/** @see https://www.delftstack.com/howto/typescript/typescript-multiple-inheritance/ */
export function applyMixins(derived: Class, superList: Class[]) {
    superList.forEach(x => {
        Object.getOwnPropertyNames(x.prototype)
            .forEach(y => Object.defineProperty(
                derived.prototype,
                y,
                Object.getOwnPropertyDescriptor(x.prototype, y)!
            ))
    })
}
