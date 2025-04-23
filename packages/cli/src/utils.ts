import { Class } from '@midway3-components/core'
import { getMethodParamTypes, getPropertyType } from '@midwayjs/core'
import { dasherize, underscore } from 'inflected'
import { PositionalOptionsType } from 'yargs'

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

export function inferOptionType(
    clz: Class,
    propertyKey: string | symbol,
    parameterIndex?: number
): PositionalOptionsType | undefined {
    const type = parameterIndex != null
        ? (getMethodParamTypes(clz, propertyKey) ?? [])[parameterIndex]
        : getPropertyType(clz, propertyKey)

    if (type === String) {
        return 'string'
    } else if (type === Number) {
        return 'number'
    } else if (type === Boolean) {
        return 'boolean'
    } else {
        return undefined
    }
}

export function delay(timeMs: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, timeMs)
    })
}

export function keepProcessAlive(tickMs = 1000, tickCb?: () => void) {
    let timer: ReturnType<typeof setTimeout> | undefined
    function setup() {
        timer = setTimeout(
            () => {
                tickCb?.()
                setup()
            },
            tickMs
        )
    }

    setup()
    return () => clearTimeout(timer)
}
