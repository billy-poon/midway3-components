import { Class, DecoratorKey, identity } from '@midway3-components/core'
import { getPropertyDataFromClass, listPropertyDataFromClass, savePropertyDataToClass } from '@midwayjs/core'
import { inferOptionType } from '../utils'
import { createParameterDecorator } from './parameter'

type ArgumentOptions<T = string> = {
    type?: T
    description?: string
    demandOption?: boolean | string
}

export type DefinitionOf<T extends ArgumentOptions> = T & {
    name: string
    propertyKey: string | symbol
    parameterIndex?: number
}

export function createArgumentDecorator<T extends ArgumentOptions>(decoratorName: string) {
    type Options = T & {
        name?: string
        parameterIndex?: number
    }

    type Meta = {
        propertyKey: string | symbol
        options: Options
    }

    const PROP_KEY: DecoratorKey<Meta>
        = `@midway3-components/cli:decorator:argument::${decoratorName}`

    const PARAM_KEY: DecoratorKey<Meta[]>
        = `${PROP_KEY}:parameter`

    function save(options?: T): PropertyDecorator
    function save(name: string, options?: T): PropertyDecorator & ParameterDecorator
    function save(name: string, description: string): PropertyDecorator & ParameterDecorator
    function save(name: string, demandOption: boolean): PropertyDecorator & ParameterDecorator
    function save(x?: string | T, y?: T | string | boolean): PropertyDecorator | ParameterDecorator {
        const options = (
            typeof y === 'string'
                ? { description: y }
                : (typeof y === 'boolean'
                    ? { demandOption: y }
                    : { ...y }
                )
        ) as Options

        if (typeof x === 'string') {
            options.name = x
        } else {
            Object.assign(options, x ?? {})
        }

        return (target, propertyKey, parameterIndex) => {
            if (propertyKey == null) {
                {
                    throw new Error('Can only decorate an instance method of class.')
                }
            }

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
                const items = getPropertyDataFromClass(PARAM_KEY, target, propertyKey) ?? []
                items.push(meta)

                savePropertyDataToClass(PARAM_KEY, items, target, propertyKey)
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
                name: options.name ?? identity(propertyKey, 'Option'),
                type: options.type ?? inferOptionType(clz, propertyKey)
            }))
        if (propertyKey == null) {
            return result
        }

        const extra = listPropertyDataFromClass(PARAM_KEY, clz)
            .reduce<Definition[]>(
                (res, x) => {
                    x.forEach(({ propertyKey, options }) => {
                        if (propertyKey === propertyKey) {
                            res.push({
                                ...options,
                                propertyKey,
                                name: options.name!,
                                type: options.type ?? inferOptionType(clz, propertyKey, options.parameterIndex)
                            })
                        }
                    })
                    return res
                },
                []
            )

        return [...result, ...extra]
    }

    return { save, list }
}
