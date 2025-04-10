import { Config, DataSourceManager, ILogger, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/core'
import { ConfigurationOptions, Drizzle, DrizzleDataSourceOptions } from './interface'

@Provide()
@Scope(ScopeEnum.Singleton)
export class DrizzleDataSourceManager extends DataSourceManager<Drizzle> {
    @Logger('coreLogger')
    logger: ILogger

    @Inject()
    baseDir: string

    @Config('drizzle')
    configOptions: ConfigurationOptions['drizzle']

    @Init()
    async init() {
        await this.initDataSource(this.configOptions, this.baseDir)
    }

    getName(): string {
        return 'midwayjs:drizzle'
    }

    getDefaultDataSourceName(): string {
        return this.configOptions.defaultDataSourceName ?? 'default'
    }

    protected async createDataSource(config: DrizzleDataSourceOptions, dataSourceName: string): Promise<void | Drizzle> {
        const { type = 'postgres' } = config
        let factory: (options: DrizzleDataSourceOptions) => Drizzle | Promise<Drizzle>
        if (type === 'mysql') {
            const { create } = await import('./mysql2')
            factory = create
        } else if (type === 'postgres') {
            const { create } = await import('./postgres')
            factory = create
        } else if (type === 'libsql') {
            const { create } = await import('./libsql')
            factory = create
        } else {
            throw new Error('Unsupported data source type: ' + type)
        }

        const result = await factory(config)
        this.logger.info('[%s] client created: %s', this.getName(), dataSourceName)

        return result
    }

    protected async checkConnected(dataSource: Drizzle): Promise<boolean> {
        try {
            const client = dataSource.$client
            if (hasMethod(client, 'connect')) {
                await client.connect()
            }
            return true
        } catch (err) {
            this.logger.warn(err)
            return false
        }
    }

    protected async destroyDataSource(dataSource: Drizzle): Promise<void> {
        try {
            const client = dataSource.$client
            if (hasMethod(client, 'end')) {
                await client.end()
            } else if (hasMethod(client, 'close')) {
                await client.close()
            }
        } catch (err) {
            this.logger.warn(err)
        }
    }
}

function hasMethod<T extends PropertyKey>(val: any, name: T): val is { [K in T]: () => unknown } {
    return typeof val?.[name] === 'function'
}
