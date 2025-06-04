import { Class, DecoratorKey } from '@midway3-components/core'
import { Controller, Del, Get, getClassMetadata, listModule, MidwayWebRouterService, Patch, Post, Provide, Put, saveClassMetadata, saveModule } from '@midwayjs/core'
import type { RESTfulControllerInterface } from '../controller/restfulController'

type RouterOptions = Exclude<Parameters<typeof Controller>[1], undefined> & {
    paramName?: string
}

type ControllerOptions = {
    prefix: string
    routerOptions?: RouterOptions
}

const key: DecoratorKey<ControllerOptions>
    = '@midway3-components/web/decorator:restful-controller'

type RESTfulControllerClass = Class<RESTfulControllerInterface>
const moduleKey: DecoratorKey<RESTfulControllerClass> = key

export function RESTfulController(prefix: string, routerOptions?: RouterOptions) {
    return <T extends RESTfulControllerClass>(target: T) => {
        Provide()(target)
        saveModule(moduleKey, target)
        saveClassMetadata(key, { prefix, routerOptions }, target)
    }
}

export function getRESTfulDefinition(target: RESTfulControllerClass) {
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
        if (params != null) {
            Get('/')(...params)
        }

        params = getActionParams(target, 'createAction')
        if (params != null) {
            Post('/')(...params)
        }

        const prefix = `/:${meta.routerOptions?.paramName || 'id'}`

        params = getActionParams(target, 'viewAction')
        if (params != null) {
            Get(prefix)(...params)
        }

        params = getActionParams(target, 'updateAction')
        if (params != null) {
            Put(prefix)(...params)
            Patch(prefix)(...params)
        }

        params = getActionParams(target, 'deleteAction')
        if (params != null) {
            Del(prefix)(...params)
        }

        routerService.addController(x, meta)
    })
}

type ActionType = keyof RESTfulControllerInterface
function getActionParams(target: object, propertyKey: ActionType): [object, ActionType, PropertyDescriptor] | null {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey)
    if (descriptor != null) {
        return [target, propertyKey, descriptor]
    }

    const parent = Object.getPrototypeOf(target)
    if (parent != null) {
        const result = getActionParams(parent, propertyKey)
        if (result != null) {
            result[0] = target
            return result
        }
    }

    return null
}
