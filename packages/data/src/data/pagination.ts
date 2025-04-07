import { PaginationOptions } from '../interface'
import { Parameterized } from './parameterized'

export class Pagination extends Parameterized implements PaginationOptions {
    pageParam = 'page'
    pageSizeParam = 'per-page'
    validatePage = true
    totalCount = 0
    defaultPageSize = 20
    pageSizeLimit: [number, number] = [1, 50]

    getPageCount() {
        const { totalCount } = this
        if (totalCount > 0) {
            const pageSize = this.getPageSize()
            if (pageSize < 1) {
                return 1
            }

            return Math.ceil(totalCount / pageSize)
        }

        return 0
    }

    private _page?: number
    getPage(recalculate = false) {
        if (this._page == null || recalculate) {
            const result = this.getIntValue(this.pageParam, 1) - 1
            this.setPage(result, true)
        }

        return this._page!
    }

    setPage(value: number | null, validatePage = false) {
        if (value == null) {
            this._page = undefined
        } else {
            if (validatePage && this.validatePage) {
                const pageCount = this.getPageCount()
                if (value >= pageCount) {
                    value = pageCount - 1
                }
            }

            if (value < 0) {
                value = 0
            }

            this._page = value
        }
    }

    private _pageSize?: number
    getPageSize() {
        if (this._pageSize == null) {
            const result = this.getIntValue(this.pageSizeParam)
            this.setPageSize(
                result > 0 ? result : this.defaultPageSize,
                true
            )
        }

        return this._pageSize!
    }

    setPageSize(value: number | null, validatePageSize = false) {
        if (value == null) {
            this._pageSize = undefined
        } else {
            if (validatePageSize) {
                const [min, max] = this.pageSizeLimit
                if (value < min) {
                    value = min
                } else if (value > max) {
                    value = max
                }
            }

            this._pageSize = value
        }
    }

    getOffset() {
        const pageSize = this.getPageSize()
        return pageSize < 1 ? 0 : this.getPage() * pageSize
    }

    getLimit() {
        const pageSize = this.getPageSize()
        return pageSize < 1 ? null : pageSize
    }

    toJSON() {
        return {
            totalCount: this.totalCount,
            pageCount: this.getPageCount(),
            currentPage: this.getPage() + 1,
            perPage: this.getPageSize(),
        }
    }
}
