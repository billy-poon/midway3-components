import { Configuration, ILifeCycle, IMidwayApplication, IMidwayContainer, MidwayDecoratorService } from '@midwayjs/core'
import defaultConfig from './config/config.default'
import { registerActionHandler } from './decorator/action'
import { ContextMiddleware } from './middleware'

@Configuration({
    namespace: '@midway3-components/core',
    importConfigs: [{
        default: defaultConfig
    }]
})
export class ComponentConfiguration implements ILifeCycle {
    async onReady(container: IMidwayContainer, app: IMidwayApplication): Promise<void> {
        app.useMiddleware([
            ContextMiddleware
        ])

        const decoratorService = await container.getAsync(MidwayDecoratorService)
        registerActionHandler(decoratorService)
    }
}
