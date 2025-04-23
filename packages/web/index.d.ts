import { RestSerializerOptions } from './dist/interface'

export * from './dist/index'

declare module '@midway3-components/core/dist/interface' {
    interface SerializerOptions extends RestSerializerOptions {

    }
}
