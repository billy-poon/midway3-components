import { Class, DecoratorKey } from '@midway3-components/core'
import { Controller, Del, Get, getClassMetadata, listModule, MidwayWebRouterService, Patch, Post, Provide, Put, saveClassMetadata, saveModule } from '@midwayjs/core'
import type { RESTfulInterface } from '../controller/restfulController'

type RouterOptions = Exclude<Parameters<typeof Controller>[1], undefined> & {
    paramName?: string
}

type RESTfulOptions = {
    prefix: string
    routerOptions?: RouterOptions
}

const key: DecoratorKey<RESTfulOptions>
    = '@midway3-components/web/decorator:restful-controller'

type RESTfulClass = Class<RESTfulInterface>
const moduleKey: DecoratorKey<RESTfulClass> = key

export function RESTful(prefix: string, routerOptions?: RouterOptions) {
    return <T extends RESTfulClass>(target: T) => {
        Provide()(target)
        saveModule(moduleKey, target)
        saveClassMetadata(key, { prefix, routerOptions }, target)
    }
}

export function getRESTfulDefinition(target: RESTfulClass) {
    return getClassMetadata(key, target)
}

export function registerRESTfulControllers(routerService: MidwayWebRouterService) {
    const classList = listModule(moduleKey)
    classList.forEach(x => {
        const meta = getRESTfulDefinition(x)
        if (meta == null) {
            throw new Error(`Failed to get RESTful definition of class \`${x.name}\``)
        }

        const target = x.prototype
        let params = getActionParams(target, 'indexAction')
        if (params != null) Get('/')(...params)

        params = getActionParams(target, 'createAction')
        if (params != null) Post('/')(...params)

        const prefix = `/:${meta.routerOptions?.paramName || 'id'}`

        params = getActionParams(target, 'viewAction')
        if (params != null) Get(prefix)(...params)

        params = getActionParams(target, 'updateAction')
        if (params != null) {
            Put(prefix)(...params)
            Patch(prefix)(...params)
        }

        params = getActionParams(target, 'deleteAction')
        if (params != null) Del(prefix)(...params)

        routerService.addController(x, meta)
    })
}

type ActionType = keyof RESTfulInterface
function getActionParams(target: any, propertyKey: ActionType) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey)
    if (descriptor != null) {
        return [target, propertyKey, descriptor] as const
    }

    return null
}
