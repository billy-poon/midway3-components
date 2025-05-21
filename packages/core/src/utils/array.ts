
type AsyncMapFn<T, U> = (v: T, i: number) => Promise<U>
export async function asyncMap<T, U>(items: T[], cb: AsyncMapFn<T, U>, concurrent = false) {
    if (concurrent) {
        return Promise.all(items.map(async (x, i) => cb(x, i)))
    }

    let index = 0
    const result: U[] = []
    for (const x of items) {
        const item = await cb(x, index++)
        result.push(item)
    }

    return result
}
