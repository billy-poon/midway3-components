import { PositionalOptions as _PositionalOptions } from 'yargs'
import { createArgumentDecorator, DefinitionOf } from './argument'

export type PositionalOptions = _PositionalOptions & {
    order?: number
}
export type PositionalDefinition = DefinitionOf<PositionalOptions>
const {
    save: Positional,
    list: _listPositionals
} = createArgumentDecorator<PositionalOptions>('positional')

export { Positional }
export const listPositionals: typeof _listPositionals = (x, y) => {
    const items = _listPositionals(x, y)

    const result = items.sort((x, y) => {
        let val = (x.order ?? 0) - (y.order ?? 0)
        if (val === 0) {
            val = (x.parameterIndex ?? -1) - (y.parameterIndex ?? -1)
        }

        return val
    })

    return Object.values(
        result.reduce<Record<string, PositionalDefinition>>(
            (res, x) => (res[x.name] = x, res),
            {}
        )
    )
}
