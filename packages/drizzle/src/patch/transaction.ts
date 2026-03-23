import { AsyncLocalStorage } from 'async_hooks'
import { Drizzle } from '../drizzle'

const store: Record<string, AsyncLocalStorage<Drizzle>> = {}

export function getCurrentTransaction(dataSource: string): Drizzle | null {
    const { [dataSource]: storage } = store
    if (storage != null) {
        const result = storage.getStore()
        if (result != null) {
            return result
        }
    }

    return null
}

export function patchTransaction(drizzle: Drizzle, dataSource: string) {
    const _transaction = drizzle.transaction

    drizzle.transaction = (transaction, config) => {
        return _transaction.call(drizzle, (tx: Drizzle) => {
            const storage = store[dataSource]
                ?? new AsyncLocalStorage<Drizzle>()
            store[dataSource] = storage

            return storage.run(tx, () => transaction(tx))
        }, config)
    }

    return drizzle
}
