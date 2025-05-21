import { Context, IMiddleware, Middleware, NextFunction } from '@midwayjs/core'
import { SerializeService } from '../service/serializeService'
import { isStream } from '../utils'

type _Middleware = IMiddleware<Context, NextFunction>

interface Options {
    pretty?: boolean
    space?: number | string

    match?: _Middleware['match']
    ignore?: _Middleware['ignore']
}

function jsonSupported(val: unknown) {
    if (val === undefined) return false;
    if (Buffer.isBuffer(val)) return false;
    if (isStream(val)) return false;

    return true
}

@Middleware()
export class RESTfulMiddleware implements _Middleware {
    match?: _Middleware['match']
    ignore?: _Middleware['ignore']

    resolve(_app: unknown, options?: Options) {
        const {
            pretty = process.env.NODE_ENV === 'local',
            space = 4,
            match,
            ignore
        } = options ?? {}

        if (match != null) {
            this.match = match
        }
        if (ignore != null) {
            this.ignore = ignore
        }

        return async (ctx: Context, next: NextFunction) => {
            const retVal = await next()
            const { body = retVal } = ctx
            if (jsonSupported(body)) {
                const serializer = await this.resolveSerializer(ctx)

                const result = await serializer.serialize(body)
                if (result !== undefined && pretty) {
                    return JSON.stringify(result, null, space)
                }

                return result
            }

            return body
        }
    }

    async resolveSerializer(ctx: Context) {
        return ctx.requestContext
            .getAsync(SerializeService)
    }
}
