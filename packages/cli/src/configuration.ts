import { Configuration, ILifeCycle, IMidwayContainer, MidwayDecoratorService } from '@midwayjs/core'
import defaultConfig from './config/config.default'
import { registerParameterDecoratorHandler } from './decorator'

export const NS = '@midway3-components/cli'

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
