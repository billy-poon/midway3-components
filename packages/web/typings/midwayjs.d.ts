export { }

declare module '@midwayjs/core/dist/interface' {
    interface Context {
        path?: string
        method?: string
        origin?: string
        query?: Record<string, unknown>

        set?: (header: string, value: unknown) => void

        status?: number
        body?: unknown
    }
}
