import { RestSerializerOptions } from '../interface'

const defaultConfig = {
    data: {
        serializer: {
            totalCountHeader: 'X-Pagination-Total-Count',
            pageCountHeader: 'X-Pagination-Page-Count',
            currentPageHeader: 'X-Pagination-Current-Page',
            perPageHeader: 'X-Pagination-Per-Page',

            collectionEnvelope: undefined,
            linksEnvelope: '_links',
            metaEnvelope: '_meta',
        } satisfies RestSerializerOptions
    }
}

export default defaultConfig
