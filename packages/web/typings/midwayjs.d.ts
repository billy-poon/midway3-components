import { IViewEngine } from '@midwayjs/view'

export { }

interface Request {
    body?: unknown
    method?: string
}

declare module '@midwayjs/core/dist/interface' {
    interface Context extends IViewEngine {
        request?: Request

        path?: string
        method?: string
        origin?: string
        query?: Record<string, unknown>

        params?: Record<string, unknown>

        set?: (header: string, value: unknown) => void

        status?: number
        body?: unknown
        type?: string
    }
}
