import { Class, DecoratorKey } from '@midway3-components/core'
import { getClassMetadata, listModule, Provide, saveClassMetadata, saveModule } from '@midwayjs/core'
import { Middleware } from '../interface'
import { listOptions } from './option'
import { listPositionals } from './positional'

export type CommandOptions = {
    name?: string
    aliases?: readonly string[]
    command?: string | readonly string[]
    description?: string | false
    deprecated?: boolean | string

    middlewares?: Middleware[]
    commandMethod?: string | symbol
}

const key = Symbol('@midway3-components/cli:decorator:command')
const metaKey = key as DecoratorKey<CommandOptions>

export function Command(command?: string): ClassDecorator
export function Command(options: CommandOptions): ClassDecorator
export function Command(x?: string | CommandOptions): ClassDecorator {
    const options: CommandOptions = typeof x === 'string'
        ? { command: x }
        : x ?? {}

    return (target) => {
        saveModule(key, target)
        saveClassMetadata(metaKey, options, target)

        Provide()(target)
    }
}

export function listCommandClass() {
    return listModule(key) as Class[]
}

export function getCommandDefinition(clz: Class) {
    const options = getClassMetadata(metaKey, clz)
    return {
        ...options,
        commandClass: clz,
        options: listOptions(clz),
        positionals: listPositionals(clz),
    }
}

export type CommandDefinition = ReturnType<typeof getCommandDefinition>
