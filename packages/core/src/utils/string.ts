import { dasherize, underscore } from 'inflected'

export function identity(val: unknown, suffix = '') {
    let str = String(val)
    if (typeof val === 'symbol') {
        const [, desc] = /^Symbol\((.+)\)$/.exec(str) ?? []
        if (desc != null) {
            str = desc
        }
    }

    if (suffix !== '' && str.endsWith(suffix)) {
        str = str.slice(0, -suffix.length)
    }

    str = underscore(str)
    return dasherize(str)
}
