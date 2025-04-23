import { Configuration } from '@midwayjs/core'
import defaultConfig from './config/config.default'

@Configuration({
    importConfigs: [
        {
            default: defaultConfig
        }
    ]
})
export class ComponentConfiguration {

}
