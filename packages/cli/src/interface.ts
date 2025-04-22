import type { IMiddleware as _IMiddleware, CommonMiddleware, IConfigurationOptions, IMidwayApplication, IMidwayContext, NextFunction } from '@midwayjs/core'
import type { ArgumentsCamelCase, Argv } from 'yargs'

export interface ICommand {
    exec(ctx: Context, ...rest: any): any
}

export type Context = IMidwayContext<{
    argv: ArgumentsCamelCase
    body: unknown
    command: string
    exitCode?: number
}>

export type { NextFunction }
export type Middleware = CommonMiddleware<Context, NextFunction, never>
export type IMiddleware = _IMiddleware<Context, NextFunction, never>

export type Args = string | readonly string[]
export interface Application<T = {}> extends IMidwayApplication<Context, Argv<T>> {
    args: Args
    interactive: () => Promise<number>
}

export type YargsOptions = Pick<
    { [K in keyof Argv]?: Argv[K] extends ((x: infer P) => Argv) ? P : never },
    'detectLocale' |
    'env' |
    'epilog' |
    'epilogue' |
    // 'exitProcess' |
    'fail' |
    // 'help' |
    'locale' |
    'scriptName' |
    'showHelpOnFail' |
    'strict' |
    'strictCommands' |
    'strictOptions' |
    'usage' |
    'version' |
    'wrap'
>

export type Provide<T> = T | (() => T | PromiseLike<T>)
export interface ComponentOptions extends IConfigurationOptions {
    cwd?: string
    args?: Provide<Args>
    yargs?: YargsOptions
    prompt?: Provide<string>
}

export interface ConfigurationOptions {
    cli: ComponentOptions
}
