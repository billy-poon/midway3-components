import { Context, IMiddleware, Middleware, NextFunction } from '@midwayjs/core'
import { AsyncLocalStorage } from 'async_hooks'

const storage = new AsyncLocalStorage()

export function getCurrentContext<T extends Context = Context>(): T | null
export function getCurrentContext<T extends Context = Context>(required: true): T
export function getCurrentContext(required = false): Context | null {
    const result = storage.getStore() as Context
    if (result == null && required) {
        throw new Error('Current context is not set.')
    }

    return result ?? null
}

@Middleware()
export class ContextMiddleware implements IMiddleware<Context, NextFunction> {
    resolve() {
        return async (ctx: Context, next: NextFunction) => {
            return storage.run(ctx, next)
        }
    }
}
