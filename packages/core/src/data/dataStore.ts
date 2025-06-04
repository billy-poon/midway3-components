import { Awaitable } from '../interface'
import { QueryInterface } from './activeDataProvider'

export interface DataStore<T> {
    query(): QueryInterface<T>
    get(cond: unknown): Awaitable<T | null>

    init(): Awaitable<T>
    save(data: T): Awaitable<T>
    delete(data: T): Awaitable<void>
}
