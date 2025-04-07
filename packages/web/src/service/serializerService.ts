import { SerializerService as BaseService } from '@midway3-components/data'
import { AbstractModel, Pagination } from '@midway3-components/data/dist/data'
import { BaseDataProvider } from '@midway3-components/data/dist/data/baseDataProvider'
import { Config, Context, Inject, Provide } from '@midwayjs/core'
import { RestSerializerOptions } from '../interface'

@Provide()
export class SerializerService extends BaseService {
    @Inject()
    ctx: Context

    @Config('data.serializer')
    serializerOptions: RestSerializerOptions

    protected getParams() {
        return this.ctx.query ?? {}
    }

    protected isHead() {
        return this.ctx.method?.toUpperCase() === 'HEAD'
    }

    protected async serializeDataProvider(dataProvider: BaseDataProvider): Promise<unknown> {
        const { data, pagination }: {
            data?: unknown
            pagination?: Pagination | false
        } = await super.serializeDataProvider(dataProvider) ?? {}

        if (pagination) {
            this.addPaginationHeaders(pagination)
        }

        if (this.isHead()) {
            return undefined
        }

        const {
            collectionEnvelope = '',
        } = this.serializerOptions

        if (collectionEnvelope === '') {
            return data
        }

        const result = {
            [collectionEnvelope]: data,
            ...(pagination ? this.serializePagination(pagination) : {}),
        }

        return result
    }

    protected serializePagination(pagination: Pagination) {
        // TODO: serializePagination
        return {}
    }

    protected addPaginationHeaders(pagination: Pagination) {
        if (typeof this.ctx.set !== 'function') return;

        const {
            totalCountHeader,
            pageCountHeader,
            currentPageHeader,
            perPageHeader,
        } = this.serializerOptions

        this.ctx.set(totalCountHeader, pagination.totalCount)
        this.ctx.set(pageCountHeader, pagination.getPageCount())
        this.ctx.set(currentPageHeader, pagination.getPage() + 1)
        this.ctx.set(perPageHeader, pagination.getPageSize())

        // TODO: Link
        // this.ctx.set('Link', pagination.getPageSize() + '')
    }

    protected serializeModelErrors(model: AbstractModel) {
        this.ctx.status = 422 // Data Validation Failed.
        return super.serializeModelErrors(model)
    }
}
