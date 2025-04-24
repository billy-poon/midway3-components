import { ConfigurationOptions } from './dist/interface'

export * from './dist/index'

declare module '@midwayjs/core/dist/interface' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface MidwayConfig extends PowerPartial<ConfigurationOptions> {
    }
}
