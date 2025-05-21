import { Awaitable, identity, isPrimitive } from '@midway3-components/core'
import { isDataProvider, Sort } from '@midway3-components/core/dist/data'
import { Context, createCustomMethodDecorator, getCurrentApplicationContext, getCurrentMainApp, getProviderUUId, IObjectDefinition, MidwayDecoratorService, REQUEST_OBJ_CTX_KEY, RequestMethod } from '@midwayjs/core'
import type { RenderOptions as _RenderOptions } from '@midwayjs/view'
import { basename, dirname, relative, resolve } from 'path'
import { Pagination } from '../data/pagination'
import { SerializeService } from '../service/serializeService'

const key = '@midway3-components/web:decorator:render'

export interface Locals {
    data?: unknown
    content?: unknown

    $sort?: Sort | null
    $pagination?: Pagination | null
    $models?: unknown[]

    [_: string]: unknown
}

export interface RenderOptions extends _RenderOptions {
    locals?: Locals
}

type RequestMethod = Lowercase<keyof typeof RequestMethod>

export interface RenderContext<RES = unknown, CTX = Context, CTL = object> {
    result: RES

    context: CTX,
    controller: CTL
    actionMethod: PropertyKey
    requestMethod: RequestMethod

    definition: IObjectDefinition
}


export type RenderOptionsFactory<RES = unknown, CTX = Context, CTL = unknown> =
    (ctx: RenderContext<RES, CTX, CTL>) => Awaitable<RenderOptions>

export function Render(view?: string, locals?: Locals): MethodDecorator
export function Render(options: RenderOptions): MethodDecorator
export function Render<
    RES = unknown,
    CTX extends Context = Context,
    CTL extends object = object,
>(factory: RenderOptionsFactory<RES, CTX, CTL>): MethodDecorator
export function Render(x: unknown, y?: unknown) {
    let factory: RenderOptionsFactory
    if (x == null) {
        factory = () => ({})
    } else if (typeof x === 'function') {
        factory = x as RenderOptionsFactory
    } else if (typeof x === 'string') {
        const locals = y != null ? { ...y } : undefined
        factory = () => ({ name: x, locals })
    } else if (typeof x === 'object') {
        factory = () => ({ ... x })
    } else {
        throw new Error('Unsupported render options.')
    }


    return createCustomMethodDecorator(key, factory)
}

export function registerRenderHandler(service: MidwayDecoratorService) {
    service.registerMethodHandler(key, (opt) => ({
        async afterReturn(jp, result) {
            const {
                target: controller,
                methodName: actionMethod,
            } = jp

            const context: Context = controller[REQUEST_OBJ_CTX_KEY]
            if (context == null) {
                throw new Error('Failed to resolve request context.')
            }

            const uuid = getProviderUUId(controller.constructor)
            const definition = context.requestContext.registry.getDefinition(uuid)
                ?? getCurrentApplicationContext().registry.getDefinition(uuid)

            const requestMethod = (context.request?.method ?? '') as RequestMethod
            const factory: RenderOptionsFactory = opt.metadata

            const ctx: RenderContext = {
                result,
                context,
                controller,
                actionMethod,
                requestMethod,
                definition,
            }

            const options = await factory(ctx) ?? {}

            const name = options.name ?? await getView(ctx)
            const locals = { ...options.locals, ...await toLocals(result, context) }

            const html = await context.render(name, locals, options)
            return context.body ?? html
        }
    }))
}

async function getView(ctx: RenderContext) {
    const {
        controller: ctrl,
        actionMethod: action,
        // context,
        definition
    } = ctx

    // const { path } = context
    // if (path != null) {
    //     let view = path
    //     if (view.endsWith('/')) {
    //         view += 'index'
    //     }
    //     if (view.startsWith('/')) {
    //         view = view.replace(/^\/+/, '')
    //     }
    //     if (await existsView(view)) {
    //         return view
    //     }
    // }

    let ctrlDir = getCtrlDir(definition)
    const ctrlName = identity(ctrl.constructor.name, 'Controller')
    if (ctrlDir != null && basename(ctrlDir) === ctrlName) {
        ctrlDir = dirname(ctrlDir)
    }

    const actionName = identity(action, 'Action')

    return [ctrlDir, ctrlName, actionName].filter(Boolean).join('/')
}

// async function existsView(name: string) {
//     try {
//         const { ViewManager } = await import('@midwayjs/view')
//         const service = await getCurrentApplicationContext()
//             .getAsync(ViewManager)

//         await service.resolve(name)
//         return true
//     } catch (err) {
//         if (err instanceof AssertionError) {
//             return false
//         }

//         throw err
//     }
// }

function getCtrlDir(ctrlDef: IObjectDefinition) {
    const ctrlPath = resolve(ctrlDef.srcPath)
    const baseDir = resolve(getCurrentMainApp().getBaseDir())
    if (ctrlPath.startsWith(baseDir)) {
        let result = relative(baseDir, ctrlPath)
        if (result.startsWith('controller/')) {
            result = result.slice(11)
        }

        return dirname(result)
    }

    return null
}

async function toLocals(value: unknown, ctx: Context): Promise<Locals> {
    if (isPrimitive(value)) {
        return { content: value }
    } if (Array.isArray(value)) {
        return { data: value }
    } else if (isDataProvider(value)) {
        const serializer = await ctx.requestContext
            .getAsync(SerializeService)
        const result = await serializer.serialize(value) as any

        const $models = await value.getModels()
        const $sort = value.getSort() || null
        const $pagination = value.getPagination() || null

        return {
            ...result,
            $models,
            $sort,
            $pagination: $pagination as any
        }
    }
    return { value }
}
