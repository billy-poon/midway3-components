import { Class } from '@midway3-components/data'
import { getClassMetadata, listModule, Provide, saveClassMetadata, saveModule } from '@midwayjs/core'
import { Middleware } from '../interface'
import { listNamedOptions, listPositionalOptions } from './option'

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

export function Command(command?: string): ClassDecorator
export function Command(options: CommandOptions): ClassDecorator
export function Command(x?: string | CommandOptions): ClassDecorator {
    const options: CommandOptions = typeof x === 'string'
        ? { command: x }
        : x ?? {}

    return (target) => {
        saveModule(key, target)
        saveClassMetadata(key, options, target)

        Provide()(target)
    }
}

export function listCommandClass() {
    return listModule(key) as Class[]
}

export function getCommandDefinition(clz: Class) {
    const options: CommandOptions | undefined = getClassMetadata(key, clz)
    return {
        ...options,
        commandClass: clz,
        namedOptions: listNamedOptions(clz),
        positionalOptions: listPositionalOptions(clz),
    }
}

export type CommandDefinition = ReturnType<typeof getCommandDefinition>
