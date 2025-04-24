import { RestSerializerOptions } from './dist/interface'

export * from './dist/index'

declare module '@midway3-components/core/dist/interface' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface SerializerOptions extends RestSerializerOptions {

    }
}
