import { ActiveDataProvider, Awaitable, Class, configure, DataProviderInterface, DataStore } from '@midway3-components/core'
import { Context, getCurrentApplicationContext, transformRequestObjectByType } from '@midwayjs/core'
import { ForbiddenError, HttpStatus, NotFoundError } from '@midwayjs/core/dist/error/http'
import { isObject } from '@midwayjs/core/dist/util/types'
import { getRESTfulDefinition } from '../decorator/restfulController'

export interface RESTfulControllerInterface<T = any, C extends Context = any> {
    indexAction(ctx: C, ...args: any): Promise<DataProviderInterface<T> | T[]>
    viewAction(ctx: C, ...args: any): Promise<T>

    createAction?(ctx: C, ...args: any): Promise<T>
    updateAction?(ctx: C, ...args: any): Promise<T>
    deleteAction?(ctx: C, ...args: any): Promise<void>
}

export interface RESTfulFrom<T> {
    apply?(model: T): T | void
}

export type Scenario = keyof ({
    [K in keyof RESTfulControllerInterface as K extends `${infer P}Action` ? P : never]: unknown
})

export interface RESTfulControllerOptions {
    readonly?: boolean
    editBodyClz?: Class
    createBodyClz?: Class
    updateBodyClz?: Class
}

function defaultApply<T extends object>(target: T, form: object) {
    return configure(target, form)
}

export class BaseRESTfulController<T extends object, C extends Context = any> implements RESTfulControllerInterface<T, C> {
    constructor(
        protected readonly store: DataStore<T>
    ) {}

    protected getOptions(): RESTfulControllerOptions {
        return {}
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async indexAction(ctx: C, ...args: any): Promise<DataProviderInterface<T> | T[]> {
        const query = this.store.query()
        return ActiveDataProvider.create(query)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async viewAction(ctx: C, ...args: any) {
        return this.resolveOne(ctx, 'view')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createAction(ctx: C, ...args: any) {
        await this.assertMutable(ctx, 'create')

        const store = this.store
        const model = await store.init()
        const body = await this.getRequestBody(ctx, 'create') as RESTfulFrom<T>

        const mutated = typeof body.apply === 'function'
            ? body.apply(model) as any ?? model
            : defaultApply(model, body)

        const result = store.save(mutated)
        ctx.status = HttpStatus.CREATED
        return result
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async updateAction(ctx: C, ...args: any) {
        await this.assertMutable(ctx, 'update')

        const model = await this.resolveOne(ctx, 'update')
        const body = await this.getRequestBody(ctx, 'update') as RESTfulFrom<T>

        const mutated = typeof body.apply === 'function'
            ? body.apply(model) as any ?? model
            : defaultApply(model, body)

        const result = this.store.save(mutated)
        return result
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async deleteAction(ctx: C, ...args: any) {
        await this.assertMutable(ctx, 'delete')

        const model = await this.resolveOne(ctx, 'delete')

        await this.store.delete(model)
        ctx.status = HttpStatus.NO_CONTENT
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected assertMutable(ctx: C, scenario: Scenario): Awaitable<void> {
        if (this.getOptions().readonly) {
            throw new ForbiddenError('This path is readonly: ' + ctx.path)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async resolveOne(ctx: C, scenario: Scenario) {
        const paramName = this.paramName()
        const { [paramName]: id } = ctx.params ?? {}
        if (id == null) {
            throw new Error(`Failed to resolve \`${paramName}\` param value.`)
        }

        const result = await this.store.get(id)
        if (result == null) {
            throw new NotFoundError('Object not found: ' + String(id))
        }

        return result
    }

    protected paramName() {
        const ctor = this.constructor as Class<RESTfulControllerInterface>
        const meta = getRESTfulDefinition(ctor)
        return meta?.routerOptions?.paramName || 'id'
    }

    protected async getRequestBody(ctx: C, scenario: Scenario) {
        const body = ctx.request?.body ?? {}
        if (!isObject(body)) {
            throw new Error('Non-object body is not supported.')
        }

        const options = this.getOptions()

        let bodyClz: Class | undefined
        if (scenario === 'create') {
            bodyClz = options.createBodyClz ?? options.editBodyClz
        } else if (scenario === 'update') {
            bodyClz = options.updateBodyClz ?? options.editBodyClz
        }

        if (bodyClz != null) {
            const result = transformRequestObjectByType(body, bodyClz)
            const container = getCurrentApplicationContext()
            if (container.hasNamespace('validate')) {
                const { ValidateService } = await import('@midwayjs/validate')
                const service = await container.getAsync(ValidateService)
                const { value } = service.validate(bodyClz, result) ?? {}
                if (value != null) {
                    return value
                }
            }
        }

        return body
    }
}

export type RESTfulControllerConstructor<T extends object, C extends Context> = new (...args: any) => BaseRESTfulController<T, C>

export function RESTfulControllerClass<T extends object, C extends Context = any>(store: DataStore<T>, options?: RESTfulControllerOptions): RESTfulControllerConstructor<T, C>
export function RESTfulControllerClass<T extends object, C extends Context = any>(store: DataStore<T>, options?: RESTfulControllerOptions) {
    return class extends BaseRESTfulController<T, C> {
        constructor() {
            super(store)
        }

        protected getOptions(): RESTfulControllerOptions {
            return options ?? super.getOptions()
        }
    }
}
