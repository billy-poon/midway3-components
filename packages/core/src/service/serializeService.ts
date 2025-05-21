import { Config, Init, Provide } from '@midwayjs/core'
import { BaseDataProvider, isDataProvider } from '../data/baseDataProvider'
import { AbstractModel, isModel, ProxyModel } from '../data/model'
import { Pagination } from '../data/pagination'
import { Sort } from '../data/sort'
import { ConfigurationOptions, ParametersFactory, RequestParameters, SerializerOptions } from '../interface'
import { configure, isPrimitive } from '../utils'

@Provide()
export class SerializeService implements SerializerOptions {
    @Config('data')
    configOptions: ConfigurationOptions['data']

    fieldsParam = 'fields'
    expandParam = 'expand'
    separator: string | RegExp = /\s*,\s*/
    paramsFactory?: ParametersFactory

    @Init()
    async init(this: SerializeService) {
        configure(this, this.configOptions.serializer)
        if (typeof this.paramsFactory === 'function') {
            this._params = await this.paramsFactory()
        }
    }

    _params?: RequestParameters
    protected getParams(): RequestParameters {
        return this._params ?? {}
    }

    async serialize(data: unknown) {
        if (data != null && typeof data === 'object') {
            if (isModel(data) && data.hasErrors()) {
                return this.serializeModelErrors(data)
            } else if (isDataProvider(data)) {
                return this.serializeDataProvider(data)
            } else if (Array.isArray(data)) {
                return this.serializeModels(data)
            } else if (typeof data === 'object') {
                return this.serializeModel(data)
            }
        }

        return data
    }

    protected getRequestedFields() {
        const params = this.getParams()
        const [fields, expand] = [this.fieldsParam, this.expandParam]
            .map(x => {
                return String(params[x] ?? '')
                    .split(this.separator)
                    .filter(Boolean)
            })

        return { fields, expand }
    }

    protected getRequestedPagination() {
        const result = new Pagination()
            .configure(this.configOptions.pagination)

        return result
    }

    protected getRequestedSort() {
        const result = new Sort()
            .configure(this.configOptions.sort)

        return result
    }

    protected async serializeDataProvider(dataProvider: BaseDataProvider): Promise<unknown> {
        if (!dataProvider.hasPagination()) {
            dataProvider.setPatination(this.getRequestedPagination())
        }
        if (!dataProvider.hasSort()) {
            dataProvider.setSort(this.getRequestedSort())
        }

        const components = [
            dataProvider.getSort(),
            dataProvider.getPagination(),
        ] as const

        components.forEach(x => {
            if (x && x.params == null) {
                x.params = this.getParams()
            }
        })

        const models = await dataProvider.getModels()
        const data = await this.serializeModels(models)

        const [ sort, pagination ] = components
        return {
            data,
            sort,
            pagination
        }
    }

    protected async serializeModel(model: object) {
        const m = isModel(model)
            ? model : new ProxyModel(model)

        const { fields, expand } = this.getRequestedFields()
        return m.serialize(fields, expand)
    }

    protected serializeModelErrors(model: AbstractModel) {
        return Object.entries(model.getFirstErrors())
            .map(([field, message]) => ({ field, message }))
    }

    protected async serializeModels(models: unknown[]) {
        const { fields, expand } = this.getRequestedFields()

        const result: unknown[] = []
        for (const x of models) {
            let item: unknown
            if (isPrimitive(x)) {
                item = x
            } else if (Array.isArray(x)) {
                item = this.serializeModels(x)
            } else {
                const m = isModel(x)
                    ? x : new ProxyModel(x as object)

                item = await m.serialize(fields, expand)
            }

            result.push(item)
        }

        return result
    }
}
