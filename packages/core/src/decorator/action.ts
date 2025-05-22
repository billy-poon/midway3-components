import { Context, createCustomMethodDecorator, MidwayDecoratorService, REQUEST_OBJ_CTX_KEY } from '@midwayjs/core'
import { isModel } from '../data'
import { Class } from '../interface'

export interface IAction<CTX extends Context = any, RES = any> {
    run(ctx: CTX, ...args: any): Promise<RES>
}

type Meta = {
    actionClz: Class
    constructArgs?: unknown[]
}

const key = '@midway3-components/core:decorator:action'

export function Action<T extends Class<IAction>>(actionClz: T, constructArgs?: ConstructorParameters<T>): MethodDecorator {
    const meta: Meta = { actionClz, constructArgs }
    return createCustomMethodDecorator(key, meta)
}

export function registerActionHandler(decoratorService: MidwayDecoratorService) {
    decoratorService.registerMethodHandler(key, (opt) => ({
        async around(p) {
            const ctx: Context = p.target[REQUEST_OBJ_CTX_KEY]
            if (ctx == null) {
                throw new Error('Failed to resolve request context.')
            }

            const { actionClz, constructArgs } = opt.metadata as Meta
            const action = await ctx.requestContext.getAsync<IAction>(actionClz, constructArgs)

            try {
                const args = p.args[0] === ctx
                    ? p.args.slice(1)
                    : p.args

                const result = await action.run(ctx, ...args)
                const nextVal = await p.proceed?.(ctx, result, ...args)

                return nextVal !== undefined ? nextVal : result
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
