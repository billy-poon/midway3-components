import { App, Configuration, ILifeCycle, ILogger, Logger } from '@midwayjs/core'

import * as cli from '@midway3-components/cli'
import { getCurrentContext } from '@midway3-components/core'
import * as drizzle from '@midway3-components/drizzle'
import { join } from 'path'
import { OutputMiddleware } from './middleware/output.middleware'

const logLevel = process.argv.includes('--verbose') ? 'debug' : 'warn'

@Configuration({
    imports: [
        cli,
        drizzle,
    ],
    importConfigs: [
        join(__dirname, '../config'),
        {
            default: {
                data: {
                    serializer: {
                        paramsFactory() {
                            return getCurrentContext<cli.Context>()?.argv ?? {}
                        }
                    }
                },
                midwayLogger: {
                    default: {
                        transports: {
                            console: { level: logLevel, }
                        }
                    },
                    clients: {
                        appLogger: { level: logLevel },
                        coreLogger: { level: logLevel },
                    },
                }
            }
        }
    ],
})
export class MainConfiguration implements ILifeCycle {
    @App()
    app: cli.Application

    @Logger()
    logger: ILogger

    async onReady(): Promise<void> {
        this.logger.info('onReady()')

        this.app.useMiddleware([
            OutputMiddleware,
        ])
    }

    async onStop(): Promise<void> {
        this.logger.info('onStop()')
    }
}
