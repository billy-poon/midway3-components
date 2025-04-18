import { getClassMetadata, saveClassMetadata } from '@midwayjs/core'
import { ORDER, SortableAttributes } from '../data'
import { Class } from '../interface'
import { getSuperClass } from '../utils'

const key = Symbol('decorator-key:sortable')

export interface SortableOptions<T> {
    /**
     * Define sortable attributes, e.g.
     * ```ts
     * [
     *   'id',
     *   {
     *     name: 'name',
     *     asc: { 'first_name': 'asc', 'last_name': 'asc' },
     *     desc: { 'first_name': 'desc', 'last_name': 'desc' },
     *   },
     *   // OR
     *   {
     *     name: 'name',
     *     propertyKey: ['first_name', 'last_name']
     *   }
     * ]
     * ```
     *
     */
    attributes?: SortableAttributes<T>

    /**
     * Define the default orders, e.g.
     * ```ts
     * {
     *   id: 'desc',
     *   name: 'asc',
     * }
     * ```
     */
    defaultOrder?: Record<string, ORDER>
}

export function Sortable<T = any>(options: SortableOptions<T>): ClassDecorator
export function Sortable<T = any>(attributes: SortableAttributes<T>): ClassDecorator
export function Sortable<T = any>(x: unknown): ClassDecorator {
    const options: SortableOptions<T> = Array.isArray(x)
        ? { attributes: x }
        : x as SortableOptions<T>

    return (target) => {
        saveClassMetadata(key, options, target)
    }
}

export function getSortableOptions<T>(clz: Class<T>): SortableOptions<T> {
    const result: SortableOptions<T> = getClassMetadata(key, clz) ?? {}
    const superClz = getSuperClass(clz)
    if (superClz != null) {
        const parent = getSortableOptions(superClz)
        return {
            attributes: [...(parent.attributes ?? []), ...(result.attributes ?? [])] as any,
            defaultOrder: { ...parent.defaultOrder, ...result.defaultOrder }
        }
    }

    return result
}
