import { Class, DecoratorKey } from '@midway3-components/core'
import { listPropertyDataFromClass, savePropertyDataToClass } from '@midwayjs/core'
import { CommandDefinition, CommandOptions } from './command'
import { listOptions } from './option'
import { listPositionals } from './positional'

type Meta = {
    options: CommandOptions
    propertyKey: string | symbol
}

const key: DecoratorKey<Meta>
    = Symbol('@midway3-components/cli:decorator:sub-command')

export function SubCommand(command?: string): MethodDecorator
export function SubCommand(options: CommandOptions): MethodDecorator
export function SubCommand(x?: string | CommandOptions): MethodDecorator {
    const options: CommandOptions = typeof x === 'string'
        ? { command: x }
        : x ?? {}

    return (target, propertyKey) => {
        const meta: Meta = { options, propertyKey }
        savePropertyDataToClass(key, meta, target, propertyKey)
    }
}

export function listSubCommands(clz: Class): CommandDefinition[] {
    return listPropertyDataFromClass(key, clz)
        .map(({ options, propertyKey }) => ({
            ...options,
            commandClass: clz,
            commandMethod: propertyKey,
            options: listOptions(clz, propertyKey),
            positionals: listPositionals(clz, propertyKey),
        }))
}
