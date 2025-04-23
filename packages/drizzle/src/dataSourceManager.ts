import { Config, DataSourceManager, getCurrentApplicationContext, ILogger, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/core'
import { ConfigurationOptions, DialectType, Drizzle, DrizzleDataSourceOptions } from './interface'

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
        type PlainOptions = {
            type?: DialectType
            connection?: string
        }
        const { type, connection } = config as PlainOptions
        const theType = type != null
            ? type : parseType(connection ?? '')

        let factory: (options: DrizzleDataSourceOptions) => Drizzle | Promise<Drizzle>
        if (theType === 'mysql') {
            const { create } = await import('./mysql')
            factory = create as any
        } else if (theType === 'postgresql') {
            const { create } = await import('./postgresql')
            factory = create as any
        } else if (theType === 'sqlite') {
            const { create } = await import('./sqlite')
            factory = create as any
        } else {
            throw new Error(`Unsupported dataSource [${dataSourceName}] type: ${theType}`)
        }

        const result = await factory(config)
        this.logger.info('[%s] client created: %s', this.getName(), dataSourceName)

        return result
    }

    protected async checkConnected(dataSource: Drizzle): Promise<boolean> {
        try {
            const client = dataSource.$client
            if (typeof client.connect === 'function') {
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
            if (typeof client.end === 'function') {
                await client.end()
            } else if (typeof client.close === 'function') {
                await client.close()
            }
        } catch (err) {
            this.logger.warn(err)
        }
    }
}

function parseType(connection: string): DialectType {
    const [, dialect] = /^(\w+):\/\//.exec(connection.toLowerCase()) ?? []
    if (dialect === 'postgres') {
        return 'postgresql'
    } else if (dialect === 'file') {
        return 'sqlite'
    }

    return (dialect ?? '<empty>') as DialectType
}

export function getDataSource(dataSourceName?: string) {
    const service = getCurrentApplicationContext()
        .get(DrizzleDataSourceManager)

    const name = dataSourceName ?? service.getDefaultDataSourceName()
    const result = service.getDataSource(name)
    if (result == null) {
        throw new Error('Failed to get dataSource: ' + name)
    }

    return result
}
