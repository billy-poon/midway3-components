import { Readable } from 'stream'
import { format } from 'util'

export function isStream(val: unknown): val is Readable {
    if (val != null) {
        const readable = val as Readable
        return typeof readable.pipe === 'function'
    }

    return false
}


interface FormatSupported {
    // eslint-disable-next-line no-shadow
    format(template: string): unknown
}

function getFormattedValue(data: object, key: PropertyKey) {
    if (typeof key === 'string') {
        const [x, y] = key.split(':', 2)
        if (y != null) {
            const val = getPropertyValue(data, x) as FormatSupported
            if (typeof val?.format === 'function') {
                return val.format(y)
            }
            return format(y, val)
        }
    }

    return getPropertyValue(data, key)
}

function getPropertyValue(data: object, key: PropertyKey) {
    let result = data[key]
    if (result === undefined && typeof key === 'string') {
        const [x, y] = key.split('.', 2)
        if (y != null) {
            result = data[x]
            if (result != null && typeof result === 'object') {
                return getPropertyValue(result, y)
            }
        }
    }

    return result
}

// https://github.com/Leaflet/Leaflet/blob/master/src/core/Util.js#L158
type DataProvider = (key: string, match: string) => unknown

const templateRe = /\{ *([\w-.:]+) *\}/g
// eslint-disable-next-line no-shadow
export function template(format: string, data: object | DataProvider, regex?: RegExp, defaultVal?: string) {
    const provide: DataProvider = typeof data === 'function'
        ? data as DataProvider
        : (key) => getFormattedValue(data, key)

    return format.replace(regex ?? templateRe, function (match, key) {
        const value = provide(key, match)

        if (value == null) {
            return defaultVal ?? match
        }

        return typeof value === 'function'
            ? value(data, key, match)
            : value
    })
}
