import { Configuration, ILifeCycle, IMidwayContainer } from '@midwayjs/core'
import defaultConfig from './config/config.default'
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
    }
}
