import { Class, getCurrentContext, identity } from '@midway3-components/core'
import { Context, getCurrentApplicationContext, Init, MidwayWebRouterService, Provide, REQUEST_OBJ_CTX_KEY, RouterInfo } from '@midwayjs/core'
import { ParsedUrlQueryInput, stringify } from 'querystring'
import { template } from '../utils'

type Controller = object
type ControllerClass<T extends Controller> = new (...args: any) => T

type ActionOf<T> = T extends Controller
    ? keyof {
        [K in keyof T as T[K] extends Function
            ? K extends `${string}Action`
                ? K : never
            : never
        ]: unknown
    }
    : string | symbol

declare module '@midwayjs/core' {
    // eslint-disable-next-line no-shadow
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

type ActionFactoryOf<T> = (action: ActionOf<T>) => UrlFactory
export type UrlFactory = (options?: RouteOptions) => string

function getClass<T extends object>(x: T | Class<T>): Class<T> {
    return typeof x === 'function'
        ? x : x.constructor as Class<T>
}

@Provide()
export class UrlService {
    @Init()
    async init() {
        const routerService = await getCurrentApplicationContext()
            .getAsync(MidwayWebRouterService)

        const table = await routerService.getFlattenRouterTable()
        this._routes = await this.prepareRoutes(table)
    }

    protected getContext() {
        if (this[REQUEST_OBJ_CTX_KEY] != null) {
            return this[REQUEST_OBJ_CTX_KEY] as Context
        }

        return getCurrentContext(true)
    }

    protected async prepareRoutes(routes: RouterInfo[]) {
        return routes.map(v => {
            if (typeof v.method === 'string') {
                const [ctrl = '', action = ''] = [v.controllerClz?.name, v.method]

                const ctrlKey = identity(ctrl, 'Controller')

                const actionKey = identity(action, 'Action')
                if (ctrlKey !== '' && actionKey !== '') {
                    const routeKey = [ctrlKey, actionKey].join('/')
                    v.keys = { ctrlKey, actionKey, routeKey }
                }

            }
            return v
        })
    }

    private _routes?: RouterInfo[]
    getRoutes() {
        return this._routes ?? []
    }

    /**
     * For example:
     * ```js
     * urlService.controller('account')
     * ```
     */
    controller(ctrl: string): ActionFactoryOf<unknown>
    /**
     * For example:
     * ```js
     * urlService.controller(AccountController)
     * ```
     */
    controller<T extends Controller>(ctrl: T | ControllerClass<T> | string): ActionFactoryOf<T>
    controller(ctrl: object | Class | string){
        const clz = typeof ctrl !== 'string'
            ? getClass(ctrl) : null
        const className = clz?.name ?? ctrl as string

        const routes = this.getRoutes()
            .filter(x => clz != null
                ? x.controllerClz === clz
                : x.keys?.ctrlKey === className
            )

        return (action: string | symbol): UrlFactory => {
            const route = routes.find(x => x.method === action)
                ?? routes.find(x => x.keys?.actionKey === action)
            if (route == null) {
                throw new Error(`Failed to resolve route for [${className}::${String(action)}]`)
            }

            return (options) => this.build(route, options)
        }
    }

    /**
     * For example:
     * ```js
     * urlService.action('account', 'create')
     * ```
     */
    action(ctrl: string, action: string | symbol): UrlFactory
    /**
     * For example:
     * ```js
     * urlService.action(AccountController, 'createAction')
     * ```
     */
    action<T extends Controller>(ctrl: T | ControllerClass<T> | string, action: ActionOf<T>): UrlFactory
    action(ctrl: object | Class | string, action: string | symbol) {
        const factory = this.controller(ctrl)
        return factory(action)
    }

    /**
     * For example:
     * ```js
     * urlService.path('/the/route/path')
     * ```
     */
    path(path: string): UrlFactory {
        return (options) => this.build(path, options)
    }

    /**
     * For example:
     * ```js
     * urlService.to('/the/route/path', ...)
     * ```
     */
    to(path: string, options?: RouteOptions): string
    /**
     * For example:
     * ```js
     * urlService.to(['account', 'create'], ...)
     * urlService.to(['account/create'], ...)
     * ```
     */
    to(route: [string] | [string, string], options?: RouteOptions): string
    /**
     * For example:
     * ```js
     * urlService.to([AccountController, 'createAction'], ...)
     * ```
     */
    to<T extends Controller>(route: [T | ControllerClass<T>, ActionOf<T>], options?: RouteOptions): string
    to(x: unknown, y?: RouteOptions) {
        if (Array.isArray(x)) {
            const [ctrl, _action = ''] = x as [string, string]
            let action = _action
            if (typeof ctrl === 'string' && action === '') {
                const [, __action = ''] = ctrl.split('/', 2)
                if (__action === '') {
                    throw new Error('Failed to extract action from route: ' + ctrl)
                }
                action = __action
            }
            const factory = this.action(ctrl, action)
            return factory(y)
        }

        const path = String(x)
        return this.build(path as string, y)
    }

    protected build(route?: string | RouterInfo, options?: RouteOptions) {
        let result = (typeof route === 'object'
            ? route?.fullUrl : route) ?? ''

        const { scheme, params, query } = options ?? {}
        if (params != null) {
            result = template(result, (key, match) => {
                const val = params[key]
                return val == null
                    ? match : encodeURIComponent(String(val))
            }, /:(\w+)/)
        }

        if (query != null) {
            const search = stringify(query)
            if (search !== '') {
                result += result.includes('?') ? '&' : '?' + search
            }
        }

        if (scheme && !/^https:\/\//.test(result)) {
            const { origin = '' } = this.getContext()
            if (origin === '') {
                throw new Error('Failed to resolve `origin` from current context.')
            }
            result = origin + result
        }

        return result
    }
}
