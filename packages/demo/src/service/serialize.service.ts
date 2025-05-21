import { BaseDataProvider } from '@midway3-components/core/dist/data'
import { SerializeService as _SerializeService } from '@midway3-components/web'
import { getProviderUUId, IMidwayContainer, Provide, providerWrapper } from '@midwayjs/core'

@Provide()
export class SerializeService extends _SerializeService {
    protected serializeDataProvider(dataProvider: BaseDataProvider): Promise<unknown> {
        const { sort = '', pagination = '' } = this.getParams()
        if (sort === '0') {
            dataProvider.setSort(false)
        }
        if (pagination === '0') {
            dataProvider.setPatination(false)
        }

        return super.serializeDataProvider(dataProvider)
    }
}

export function resolveSerializerService(container: IMidwayContainer, args?: any) {
    return container.getAsync(SerializeService, args)
}


export function registerSerializeService() {
    const uuid = getProviderUUId(_SerializeService)
    providerWrapper([
        {
            id: uuid,
            provider: resolveSerializerService,
            // scope: ScopeEnum.Request
        }
    ])

}
// registerSerializerService()
