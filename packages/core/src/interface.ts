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
