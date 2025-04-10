import { ConfigurationOptions } from './dist/interface'

export * from './dist/index'

declare module '@midwayjs/core/dist/interface' {
    interface MidwayConfig extends PowerPartial<ConfigurationOptions> {
    }
}
