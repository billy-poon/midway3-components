import { RestSerializerOptions } from './dist/interface'

export * from './dist/index'

declare module '@midway3-components/data/dist/interface' {
    interface SerializerOptions extends RestSerializerOptions {

    }
}
