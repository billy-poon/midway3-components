import { Configuration, ILifeCycle, IMidwayContainer, MidwayDecoratorService } from '@midwayjs/core'
import defaultConfig from './config/config.default'
import { NS } from './constants'
import { registerParameterDecoratorHandler } from './decorator'

@Configuration({
    namespace: NS,
    importConfigs: [
        {
            default: defaultConfig
        }
    ]
})
export class ComponentConfiguration implements ILifeCycle {
    async onReady(container: IMidwayContainer): Promise<void> {
        const decoratorService = await container.getAsync(MidwayDecoratorService)
        registerParameterDecoratorHandler(decoratorService)
    }
}
