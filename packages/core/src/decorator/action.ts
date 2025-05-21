import { Context, createCustomMethodDecorator, MidwayDecoratorService, REQUEST_OBJ_CTX_KEY } from '@midwayjs/core'
import { isModel } from '../data'
import { Awaitable, Class } from '../interface'

export interface IAction<CTX extends Context = any, RES = any> {
    run(ctx: CTX): Awaitable<RES>
}

type Meta = {
    clz: Class
    args?: unknown[]
}

const key = '@midway3-components/core:decorator:action'

export function Action<T extends Class<IAction>>(clz: T, args?: ConstructorParameters<T>): MethodDecorator {
    const meta: Meta = { clz, args }
    return createCustomMethodDecorator(key, meta)
}

export function registerActionHandler(decoratorService: MidwayDecoratorService) {
    decoratorService.registerMethodHandler(key, (opt) => ({
        async around(p) {
            const ctx: Context = p.target[REQUEST_OBJ_CTX_KEY]
            if (ctx == null) {
                throw new Error('Failed to resolve request context.')
            }

            const { clz, args } = opt.metadata as Meta
            const action = await ctx.requestContext.getAsync<IAction>(clz, args)

            try {
                const result = await action.run(ctx)
                p.args = [ctx, result, ...p.args]

                const nextVal = await p.proceed?.(...p.args)
                return nextVal !== undefined
                    ? nextVal : result
            } catch (err) {
                const { cause } = err ?? {}
                if (isJoiValidationError(cause)) {
                    const {
                        _original: form,
                        details,
                    } = cause

                    if (isModel(form)) {
                        details.forEach(x => {
                            form.addError(x.path.join('.'), x.message)
                        })
                        if (form.hasErrors()) {
                            return form
                        }
                    }
                }

                throw err
            }
    },
    }))
}

function isJoiValidationError(val: unknown): val is JoiValidationError {
    return val != null
        && val instanceof Error
        && val['_original'] != null
        && Array.isArray(val['details'])
}

interface JoiValidationError {
    _original: unknown
    details: ({
        message: string
        path: string[]
        type: string
        context: {
            label: string
            key: string
        }
    })[]
}

/* JoiValidationError
{
  "_original": {},
  "details": [
    {
      "message": "\\"name\\" 是必须的",
      "path": [
        "name"
      ],
      "type": "any.required",
      "context": {
        "label": "name",
        "key": "name"
      }
    }
  ]
}
 */
