import * as core from '@midway3-components/core'
import { Configuration, ILifeCycle, IMidwayContainer, Init, Inject, MidwayDecoratorService } from '@midwayjs/core'
import defaultConfig from './config/config.default'
import { DrizzleDataSourceManager } from './dataSourceManager'
import { registerInjectDrizzleHandler } from './decorator/drizzle'

@Configuration({
    imports: [
        core
    ],
    importConfigs: [
        {
            default: defaultConfig
        }
    ]
})
export class ComponentConfiguration implements ILifeCycle {
    @Inject()
    decoratorService: MidwayDecoratorService

    dataSourceManager: DrizzleDataSourceManager

    @Init()
    async init() {
        registerInjectDrizzleHandler(
            this.decoratorService,
            x => this.dataSourceManager.getDataSource(
                x ?? this.dataSourceManager.getDefaultDataSourceName()
            )
        )
    }

    async onReady(container: IMidwayContainer): Promise<void> {
        this.dataSourceManager = await container
            .getAsync(DrizzleDataSourceManager)
    }

    async onStop(): Promise<void> {
        if (this.dataSourceManager != null) {
            await this.dataSourceManager.stop()
        }
    }
}
