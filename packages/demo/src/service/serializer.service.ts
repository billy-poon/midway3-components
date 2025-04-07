import { BaseDataProvider } from '@midway3-components/data/dist/data'
import { SerializerService as _SerializerService } from '@midway3-components/web'
import { getProviderUUId, IMidwayContainer, Provide, providerWrapper } from '@midwayjs/core'

@Provide()
export class SerializerService extends _SerializerService {
    protected serializeDataProvider(dataProvider: BaseDataProvider): Promise<unknown> {
        const { sort = '', pagination = '' } = this.getParams()
        if (sort === '0') {
            dataProvider.setSort(false)
        }
        if (pagination === '') {
            dataProvider.setPatination(false)
        }

        return super.serializeDataProvider(dataProvider)
    }
}

export function resolveSerializerService(container: IMidwayContainer, args?: any) {
    return container.getAsync(SerializerService, args)
}


export function registerSerializerService() {
    const uuid = getProviderUUId(_SerializerService)
    providerWrapper([
        {
            id: uuid,
            provider: resolveSerializerService,
            // scope: ScopeEnum.Request
        }
    ])

}
// registerSerializerService()
