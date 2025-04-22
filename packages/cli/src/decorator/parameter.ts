import { createCustomParamDecorator, MidwayDecoratorService } from '@midwayjs/core'
import { Context } from '../interface'

const key = '@midway3-components/cli:decorator:parameter'

export type ParameterDecoratorOptions = {
    optionName: string
}

export function createParameterDecorator(options: ParameterDecoratorOptions) {
    return createCustomParamDecorator(key, options)
}

export function registerParameterDecoratorHandler(decoratorService: MidwayDecoratorService) {
    decoratorService.registerParameterHandler(key, (options) => {
        const { metadata, originArgs, parameterIndex } = options
        const { argv } = (originArgs[0] as Context) ?? {}
        const { optionName: name } = (metadata as ParameterDecoratorOptions) ?? {}
        if (argv != null && name != null) {
            return argv[name]
        }

        return originArgs[parameterIndex]
    })
}
