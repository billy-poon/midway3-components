import { ConfigurationOptions } from '../interface'

const defaultConfig: ConfigurationOptions = {
    data: {
        sort: {
            separator: ',',
            sortParam: 'sort',
            enableMultiSort: false,
        },
        pagination: {
            pageParam: 'page',
            pageSizeParam: 'per-page',
            pageSizeLimit: [1, 50],
            defaultPageSize: 20,
        },
        serializer: {
            fieldsParam: 'fields',
            expandParam: 'expand',
            separator: /\s*,\s*/,
        }
    }
}

export default defaultConfig
