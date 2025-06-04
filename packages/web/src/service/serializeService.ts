import { SerializeService as BaseService } from '@midway3-components/core'
import { BaseModel, Pagination } from '@midway3-components/core/dist/data'
import { BaseDataProvider } from '@midway3-components/core/dist/data/baseDataProvider'
import { Config, Context, Inject, Provide } from '@midwayjs/core'
import { Pagination as WebPagination } from '../data/pagination'
import { RestSerializerOptions } from '../interface'
import { Link } from '../link'
import { UrlService } from './urlService'

@Provide()
export class SerializeService extends BaseService {
    @Inject()
    ctx: Context

    @Inject()
    urlService: UrlService

    @Config('data.serializer')
    serializerOptions: RestSerializerOptions

    protected getParams() {
        return this.ctx.query ?? {}
    }

    protected isHead() {
        return this.ctx.method?.toUpperCase() === 'HEAD'
    }

    protected getRequestedPagination(): Pagination {
        const result = new WebPagination()
        result.urlFactory = this.urlService.path(this.ctx.path!)

        return result
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
        const {
            linksEnvelope = '',
            metaEnvelope = '',
        } = this.serializerOptions

        const result: Record<string, unknown> = {}
        if (linksEnvelope !== '' && pagination instanceof WebPagination) {
            result[linksEnvelope] = Link.serialize(pagination.getLinks(true))
        }
        if (metaEnvelope !== '') {
            result[metaEnvelope] = {
                totalCount: pagination.totalCount,
                pageCount: pagination.getPageCount(),
                currentPage: pagination.getPage() + 1,
                perPage: pagination.getPageSize()
            }
        }

        return result
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


        if (pagination instanceof WebPagination) {
            const items = Object.entries(pagination.getLinks(true))
                .map(([k, v]) => `<${v}>; rel=${k}`)
            this.ctx.set('Link', items.join(', '))
        }
    }

    protected serializeModelErrors(model: BaseModel) {
        this.ctx.status = 422 // Data Validation Failed.
        return super.serializeModelErrors(model)
    }
}
