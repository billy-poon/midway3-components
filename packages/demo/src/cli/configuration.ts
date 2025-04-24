import { App, Configuration, ILifeCycle, ILogger, Logger } from '@midwayjs/core'

import * as cli from '@midway3-components/cli'
import * as data from '@midway3-components/core'
import * as drizzle from '@midway3-components/drizzle'
import { join } from 'path'
import { OutputMiddleware } from './middleware/output.middleware'

@Configuration({
    imports: [
        cli,
        data,
        drizzle,
    ],
    importConfigs: [join(__dirname, '../config')],
})
export class MainConfiguration implements ILifeCycle {
    @App()
    app: cli.Application

    @Logger()
    logger: ILogger

    async onReady(): Promise<void> {
        this.logger.info('onReady()')

        this.app.useMiddleware([
            OutputMiddleware
        ])
    }

    async onStop(): Promise<void> {
        this.logger.info('onStop()')
    }
}
