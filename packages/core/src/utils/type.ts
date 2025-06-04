import { isClass as _isClass, isPlainObject as _isPlainObject, isPromise as _isPromise } from '@midwayjs/core/dist/util/types'
import { Class } from '../interface'

export function isClass<T = any>(val: unknown): val is Class<T> {
    return _isClass(val)
}

export function isPromise<T = any>(val: unknown): val is Promise<T> {
    return _isPromise(val)
}

export function isPlainObject<T extends object = object>(val: unknown): val is object & T {
    return _isPlainObject(val)
}
