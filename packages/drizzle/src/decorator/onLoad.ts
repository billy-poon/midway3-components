import { asyncMap, Awaitable, Class, DecoratorKey, getSuperClass } from '@midway3-components/core'
import { getClassMetadata, saveClassMetadata } from '@midwayjs/core'

export type OnLoadCallback<T = any> = (entity: T, data: object) => Awaitable<T | void>


export type LoadedEntity<T> = {
    entity: T
    data: object
}
export type OnLoadArrayCallback<T = any> = (items: LoadedEntity<T>[]) => Awaitable<LoadedEntity<T>[] | void>

type Meta = {
    callback?: OnLoadCallback
    arrayCallback?: OnLoadArrayCallback
}

const key: DecoratorKey<Meta>
    = '@midway3-components/drizzle:decorator:on-load'

export function OnLoad<T = any>(cb: OnLoadCallback<T>): ClassDecorator {
    return (target) => {
        saveClassMetadata(key, { callback: cb }, target, true)
    }
}

export function OnLoadArray<T = any>(cb: OnLoadArrayCallback<T>): ClassDecorator {
    return (target) => {
        saveClassMetadata(key, { arrayCallback: cb }, target, true)
    }
}

export async function triggerOnLoad<T extends object>(clz: Class<T>, items: LoadedEntity<T>[]): Promise<LoadedEntity<T>[]> {
    const superClz = getSuperClass(clz)
    if (superClz != null) {
        items = await triggerOnLoad(superClz, items)
    }

    const { callback, arrayCallback } = getClassMetadata(key, clz) ?? {}
    if (arrayCallback != null) {
        const result = await arrayCallback(items)
        if (Array.isArray(result)) {
            items = result
        }
    }

    if (callback != null) {
        await asyncMap(items, async ({ entity: entry, data }, i) => {
            const result = await callback(entry, data)
            if (result != null) {
                items[i].entity = result
            }
        })
    }

    return items
}
