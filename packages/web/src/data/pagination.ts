import { Pagination as _Pagination } from '@midway3-components/data/dist/data'
import { ParsedUrlQuery } from 'querystring'
import { Link } from '../link'
import { UrlFactory } from '../service/urlService'

const LINK_NEXT = 'next'
const LINK_PREV = 'prev'
const LINK_FIRST = 'first'
const LINK_LAST = 'last'

type Links = Record<string, string>

export class Pagination extends _Pagination {
    urlFactory?: UrlFactory
    forcePageParam = true

    createUrl(page: number, pageSize?: number | null, absolute = false) {
        const query = { ...this.params }
        const { pageParam, pageSizeParam, urlFactory } = this

        if (urlFactory == null) {
            throw new Error('urlFactory is not set.')
        }

        if (page > 0 || page === 0 && this.forcePageParam) {
            query[pageParam] = page + 1
        } else {
            delete query[pageParam]
        }

        const size = pageSize ?? this.getPageSize()
        if (size !== this.defaultPageSize) {
            query[pageSizeParam] = size
        } else {
            delete query[pageSizeParam]
        }

        return urlFactory({ query: query as ParsedUrlQuery, scheme: absolute })
    }

    getLinks(absolute = false): Links {
        const result: Links = {}
        if (this.urlFactory != null) {
            const currentPage = this.getPage()
            const pageCount = this.getPageCount()

            result[Link.REL_SELF] = this.createUrl(currentPage, null, absolute)

            if (pageCount > 0) {
                result[LINK_FIRST] = this.createUrl(0, null, absolute)
                result[LINK_LAST] = this.createUrl(pageCount - 1, null, absolute)
                if (currentPage > 0) {
                    result[LINK_PREV] = this.createUrl(currentPage - 1, null, absolute)
                }
                if (currentPage < pageCount - 1) {
                    result[LINK_NEXT] = this.createUrl(currentPage + 1, null, absolute)
                }
            }
        }

        return result
    }
}
