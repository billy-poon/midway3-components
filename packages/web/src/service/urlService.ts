import { getCurrentApplicationContext, Init, MidwayWebRouterService, Provide, RequestMethod, RouterInfo } from '@midwayjs/core'
import { dasherize } from 'inflected'
import { ParsedUrlQueryInput, stringify } from 'querystring'
import { getCurrentContext } from '../middleware/context.middleware'
import { template } from '../utils'

type Controller = object
// type Controller = {
//     [K: `${string}Action`]: Function
// }
type ControllerClass<T extends Controller> = new (...args: any) => T

type ActionOf<T extends Controller> = keyof {
    [K in keyof T as T[K] extends Function
        ? K extends `${string}Action`
            ? K : never
        : never
    ]: unknown
}

type RequestMethod = Lowercase<keyof typeof RequestMethod>

declare module '@midwayjs/core' {
    interface RouterInfo {
        keys?: {
            ctrlKey: string
            actionKey: string
            routeKey: string
        }
    }
}

type RouteOptions = {
    scheme?: boolean
    params?: Record<string, unknown>,
    query?: ParsedUrlQueryInput
}

type ActionFactoryOf<C extends Controller> = (action: ActionOf<C>) => RouteFactory
type RouteFactory = (options?: RouteOptions) => string

@Provide()
export class UrlService {

    @Init()
    async init() {
        const routerService = await getCurrentApplicationContext()
            .getAsync(MidwayWebRouterService)

        const table = await routerService.getFlattenRouterTable()
        this._routes = await this.prepareRoutes(table)
    }

    protected async prepareRoutes(routes: RouterInfo[]) {
        return routes.map(v => {
            if (typeof v.method === 'string') {
                const [x = '', y = ''] = [v.controllerClz?.name, v.method]

                const ctrl = x.endsWith('Controller') ? x.slice(0, -10) : x
                const action = y.endsWith('Action') ? x.slice(0, -6) : x

                if (ctrl !== '' && action !== '') {
                    const [ctrlKey, actionKey] = [ctrl, action]
                        .map(x => dasherize(x))

                    const routeKey = [ctrlKey, actionKey].join('/')
                    v.keys = { ctrlKey, actionKey, routeKey }
                }

            }
            return v
        })
    }

    _routes?: RouterInfo[]
    getRoutes() {
        return this._routes ?? []
    }

    controller<T extends Controller>(ctrl: T | ControllerClass<T>): ActionFactoryOf<T> {
        const clz = typeof ctrl === 'function' ? ctrl : ctrl.constructor
        const routes = this.getRoutes().filter(v => v.controllerClz === clz)

        return (action): RouteFactory => {
            const route = routes.find(x => x.method === action)
            if (route == null) {
                throw new Error(`Failed to resolve route for [${clz.name}::${String(action)}]`)
            }

            return (options) => this.build(route, options)
        }
    }

    action<T extends Controller>(ctrl: T | ControllerClass<T>, action: ActionOf<T>): RouteFactory {
        const factory = this.controller(ctrl)
        return factory(action)
    }

    to(routeKey: string, options?: RouteOptions): string
    to<T extends Controller>(routeKey: [T | ControllerClass<T>, ActionOf<T>], options?: RouteOptions): string
    to(x: unknown, y?: RouteOptions) {
        if (Array.isArray(x)) {
            const [ctrl, action] = x as [Controller, ActionOf<Controller>]
            const factory = this.action(ctrl, action)
            return factory(y)
        }

        const routeKey = x as string
        const route = this.getRoutes().find(x => x.keys?.routeKey === routeKey)
        if (route == null) {
            throw new Error(`Failed to resolve route [${routeKey}]`)
        }

        return this.build(route, y)
    }

    protected build(route: RouterInfo, options?: RouteOptions) {
        let result = route.fullUrl ?? ''
        const { scheme, params, query } = options ?? {}
        if (params != null) {
            result = template(result, (key, match) => {
                const val = params[key]
                return val == null
                    ? match : encodeURIComponent(String(val))
            }, /\:(\w+)/)
        }

        if (query != null) {
            const search = stringify(query)
            if (search !== '') {
                result += '?' + search
            }
        }

        if (scheme && !/^https:\/\//.test(result)) {
            const { origin = '' } = getCurrentContext() ?? {}
            if (origin === '') {
                throw new Error('Failed to resolve `origin` of current request.')
            }
            result = origin + result
        }

        return result
    }
}
