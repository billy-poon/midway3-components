type ENV = 'local' | 'production'

declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: ENV
        DB_USER: string
        DB_PASS: string
    }
}
