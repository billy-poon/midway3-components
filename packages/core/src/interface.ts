export type Awaitable<T> = T | PromiseLike<T>

export type RequestParameters = Record<string, unknown>
export type ParametersFactory = () => Awaitable<RequestParameters>

export interface SortOptions {
    sortParam: string
    separator: string | RegExp
    enableMultiSort: boolean
}

export interface PaginationOptions {
    pageParam: string
    pageSizeParam: string
    pageSizeLimit: [number, number]
    defaultPageSize: number
}

export interface SerializerOptions {
    fieldsParam: string
    expandParam: string
    separator: string | RegExp
    paramsFactory?: ParametersFactory
}

export interface ConfigurationOptions {
    data: {
        sort: SortOptions
        pagination: PaginationOptions
        serializer: SerializerOptions
    }
}

export type Class<T = any, A extends [] = any> = new (...args: A) => T

// https://github.com/vuejs/core/blob/a23fb59e83c8b65b27eaa21964c8baa217ab0573/packages/runtime-core/src/apiInject.ts#L7
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
interface DecoratorConstraint<T> {}
export type DecoratorKey<T> = string | symbol | DecoratorConstraint<T>

declare module '@midwayjs/core/dist/decorator/decoratorManager' {
    export function saveModule<T>(decoratorNameKey: DecoratorKey<T>, target: T): void
    export function listModule<T>(decoratorNameKey: DecoratorKey<T>, filter?: (module: T) => boolean): T[]

    export function saveClassMetadata<T>(decoratorNameKey: DecoratorKey<T>, data: T, target: unknown, mergeIfExist?: boolean): void
    export function getClassMetadata<T>(decoratorNameKey: DecoratorKey<T>, target: unknown): T | undefined

    export function savePropertyDataToClass<T>(decoratorNameKey: DecoratorKey<T>, data: T, target: unknown, propertyName: string | symbol): void
    export function getPropertyDataFromClass<T>(decoratorNameKey: DecoratorKey<T>, target: unknown, propertyName: string | symbol): T | undefined;
    export function listPropertyDataFromClass<T>(decoratorNameKey: DecoratorKey<T>, target: unknown): T[]
}
