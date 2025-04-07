export { }

declare module '@midwayjs/core/dist/interface' {
    interface Context {
        query?: Record<string, unknown>
        method?: string
        origin?: string

        set?: (header: string, value: unknown) => void

        status?: number
        body?: unknown
    }
}
