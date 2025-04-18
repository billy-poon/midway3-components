import { Context, IMiddleware, Middleware, NextFunction } from '@midwayjs/core'
import { SerializerService } from '../service/serializerService'
import { isStream } from '../utils'

interface Options {
    pretty?: boolean
    space?: number | string
}

function jsonSupported(val: unknown) {
    if (val === undefined) return false;
    if (Buffer.isBuffer(val)) return false;
    if (isStream(val)) return false;

    return true
}

@Middleware()
export class RESTfulMiddleware implements IMiddleware<Context, NextFunction> {
    resolve(_app: unknown, options?: Options) {
        const {
            pretty = process.env.NODE_ENV === 'local',
            space = 4,
        } = options ?? {}

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
            .getAsync(SerializerService)
    }
}
