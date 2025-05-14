import { Configuration, ILifeCycle, IMidwayContainer, MidwayDecoratorService } from '@midwayjs/core'
import defaultConfig from './config/config.default'
import { registerRenderHandler } from './decorator/render'
import { UrlService } from './service/urlService'

@Configuration({
    importConfigs: [
        {
            default: defaultConfig
        }
    ]
})
export class ComponentConfiguration implements ILifeCycle {
    async onReady(container: IMidwayContainer) {
        await container.getAsync(UrlService)

        const decoratorService = await container.getAsync(MidwayDecoratorService)
        registerRenderHandler(decoratorService)
    }
}
