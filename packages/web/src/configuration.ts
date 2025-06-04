import * as core from '@midway3-components/core'
import { Configuration, ILifeCycle, IMidwayContainer, MidwayDecoratorService, MidwayWebRouterService } from '@midwayjs/core'
import defaultConfig from './config/config.default'
import { registerRenderHandler } from './decorator/render'
import { registerRESTfulControllers } from './decorator/restful'
import { UrlService } from './service/urlService'

@Configuration({
    namespace: '@midway3-components/web',
    imports: [core],
    importConfigs: [{
        default: defaultConfig
    }]
})
export class ComponentConfiguration implements ILifeCycle {
    async onReady(container: IMidwayContainer) {
        await container.getAsync(UrlService)

        const decoratorService = await container.getAsync(MidwayDecoratorService)
        registerRenderHandler(decoratorService)

        const routerService = await container.getAsync(MidwayWebRouterService)
        registerRESTfulControllers(routerService)
    }
}
