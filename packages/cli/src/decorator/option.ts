import { Options } from 'yargs'
import { createArgumentDecorator, DefinitionOf } from './argument'

export type NamedOptions = Options
export type NamedDefinition = DefinitionOf<NamedOptions>

export const {
    save: Option,
    list: listOptions,
} = createArgumentDecorator<NamedOptions>('named')
