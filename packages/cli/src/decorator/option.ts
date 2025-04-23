import { Class } from '@midway3-components/core'
import { listPropertyDataFromClass, savePropertyDataToClass } from '@midwayjs/core'
import { Options, PositionalOptions as _PositionalOptions } from 'yargs'
import { identity, inferOptionType } from '../utils'
import { createParameterDecorator } from './parameter'

type ArgumentOptions<T = string> = {
    type?: T
}

type DefinitionOf<T extends ArgumentOptions> = T & {
    name: string
    propertyKey: string | symbol
    parameterIndex?: number
}

function createArgumentDecorator<T extends ArgumentOptions>(decoratorName: string) {
    type Options = T & {
        name?: string
        parameterIndex?: number
    }

    type Meta = {
        propertyKey: string | symbol
        options: Options
    }

    const PROP_KEY = `@midway3-components/cli:decorator:argument::${decoratorName}`
    const PARAM_KEY = `${PROP_KEY}:parameter`

    function save(options?: T): PropertyDecorator
    function save(name: string, options?: T): PropertyDecorator & ParameterDecorator
    function save(x?: string | T, y?: T): PropertyDecorator | ParameterDecorator {
        const options = (
            typeof x === 'string'
                ? { ...y, name: x }
                : { ...x, ...y }
        ) as Options

        return (target, propertyKey, parameterIndex) => {
            if (propertyKey == null) {{
                throw new Error('Can only decorate a class.method().')
            }}

            const meta: Meta = {
                propertyKey,
                options: { ...options, parameterIndex }
            }
            if (parameterIndex == null) {
                savePropertyDataToClass(PROP_KEY, meta, target, propertyKey)
            } else {
                const { name: optionName = '' } = options
                if (optionName === '') {
                    throw new Error('Option name is required for a parameter decorator.')
                }

                savePropertyDataToClass(PARAM_KEY, meta, target, propertyKey)
                createParameterDecorator({ optionName })(target, propertyKey, parameterIndex)
            }
        }
    }

    type Definition = DefinitionOf<T>

    function list(clz: Class, propertyKey?: string | symbol) {
        const result = (listPropertyDataFromClass(PROP_KEY, clz) as Meta[])
            .map(({ propertyKey, options }): Definition => ({
                ...options,
                propertyKey,
                name: options.name ?? identity(String(propertyKey), 'Option'),
                type: options.type ?? inferOptionType(clz, propertyKey)
            }))
        if (propertyKey == null) {
            return result
        }

        const extra = (listPropertyDataFromClass(PARAM_KEY, clz) as Meta[])
            .filter(x => x.propertyKey === propertyKey)
            .map(({ propertyKey, options }): Definition => ({
                ...options,
                propertyKey,
                name: options.name!,
                type: options.type ?? inferOptionType(clz, propertyKey, options.parameterIndex)
            }))

        return [...result, ...extra]
    }

    return { save, list }
}

export type NamedOptions = Options
export type NamedDefinition = DefinitionOf<NamedOptions>

export const {
    save: NamedOption,
    list: listNamedOptions,
} = createArgumentDecorator<NamedOptions>('named')


export type PositionalOptions = _PositionalOptions & {
    order?: number
}
export type PositionalDefinition = DefinitionOf<PositionalOptions>
const {
    save: PositionOption,
    list: getPositionalOptions
} = createArgumentDecorator<PositionalOptions>('positional')

export { PositionOption }
export const listPositionalOptions: typeof getPositionalOptions = (x, y) => {
    const result = getPositionalOptions(x, y)

    return result.sort((x, y) => {
        return (x.order ?? 0) - (y.order ?? 0)
    })
}
