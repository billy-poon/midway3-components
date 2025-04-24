import { Application, Context, IMiddleware } from '@midway3-components/cli'
import { isDataProvider } from '@midway3-components/core/dist/data'
import { FunctionMiddleware, Middleware, NextFunction } from '@midwayjs/core'

@Middleware()
export class OutputMiddleware implements IMiddleware {
    resolve(app: Application): FunctionMiddleware<Context, NextFunction> | Promise<FunctionMiddleware<Context, NextFunction>> {
        app.option('json', { type: 'boolean' })

        return async (ctx, next) => {
            const ret = await next()
            let body = ctx.body ?? ret
            if (isDataProvider(body)) {
                body = await body.getModels()
            }

            if (ctx.argv['json']) {
                return JSON.stringify(body, null, 2)
            }

            return body
        }
    }
}
