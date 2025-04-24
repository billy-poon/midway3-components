import { Application, Context, IMiddleware } from '@midway3-components/cli'
import { SerializerService } from '@midway3-components/core'
import { isDataProvider, Pagination, Sort } from '@midway3-components/core/dist/data'
import { FunctionMiddleware, Middleware, NextFunction } from '@midwayjs/core'

@Middleware()
export class OutputMiddleware implements IMiddleware {
    resolve(app: Application): FunctionMiddleware<Context, NextFunction> | Promise<FunctionMiddleware<Context, NextFunction>> {
        app.option('json', { type: 'boolean' })

        app.option('sort', { type: 'string' })
        app.option('page', { type: 'number' })
        app.option('per-page', { type: 'number' })

        return async (ctx, next) => {
            const ret = await next()
            let result = ctx.body ?? ret
            if (isDataProvider(result)) {
                const service = await ctx.requestContext
                    .getAsync(SerializerService)

                const {
                    data,
                    sort,
                    pagination,
                } = await service.serialize(result) as {
                    data: unknown
                    sort: Sort,
                    pagination: Pagination
                }

                console.error('---- page: %d/%d -- sort: %o ----', pagination.getPage() + 1, pagination.getPageCount(), sort.getAttributeOrders())
                result = data
            }

            if (ctx.argv['json']) {
                return JSON.stringify(result, null, 2)
            }

            return result
        }
    }
}
