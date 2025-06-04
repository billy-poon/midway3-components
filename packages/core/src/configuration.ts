import { Configuration, ILifeCycle, IMidwayContainer, MidwayDecoratorService } from '@midwayjs/core'
import defaultConfig from './config/config.default'
import { registerActionHandler } from './decorator/action'

@Configuration({
    namespace: '@midway3-components/core',
    importConfigs: [{
        default: defaultConfig
    }]
})
export class ComponentConfiguration implements ILifeCycle {
    async onReady(container: IMidwayContainer): Promise<void> {
        const decoratorService = await container.getAsync(MidwayDecoratorService)
        registerActionHandler(decoratorService)
    }
}
