export interface RestSerializerOptions {
    totalCountHeader: string
    pageCountHeader: string
    currentPageHeader: string
    perPageHeader: string

    collectionEnvelope?: string
    linksEnvelope: string
    metaEnvelope: string
}
