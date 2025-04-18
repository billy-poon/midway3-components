import { asyncMap, Awaitable, Class, getSuperClass } from '@midway3-components/data'
import { getClassMetadata, saveClassMetadata } from '@midwayjs/core'

export type OnLoadCallback<T> = (entity: T, data: object) => Awaitable<void>

const key = Symbol('@midway3-components/drizzle:decorator:on-load')

export function OnLoad<T = any>(cb: OnLoadCallback<T>): ClassDecorator {
    return (target) => {
        saveClassMetadata(key, { callback: cb }, target)
    }
}

type Meta = {
    callback: OnLoadCallback<any>
}


type LoadedEntry<T> = {
    entry: T
    data: object
}

export async function triggerOnLoad<T extends object>(clz: Class<T>, items: LoadedEntry<T>[]) {
    const superClz = getSuperClass(clz)
    if (superClz != null) {
        await triggerOnLoad(superClz, items)
    }

    const meta = getClassMetadata(key, clz)
    if (meta != null) {
        const { callback } = meta as Meta
        if (callback != null) {
            await asyncMap(items, async ({ entry, data }) => await callback(entry, data) ?? entry)
        }
    }
}
