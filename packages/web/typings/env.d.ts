type ENV = 'local' | 'production'

declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV?: ENV
    }
}
