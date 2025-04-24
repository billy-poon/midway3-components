import { Class, identity } from '@midway3-components/core'
import { BaseFramework, Framework, getCurrentMainFramework, ILogger, MidwayLifeCycleService } from '@midwayjs/core'
import { createInterface } from 'node:readline'
import { hideBin } from 'yargs/helpers'
import { NS } from './configuration'
import { CommandDefinition, getCommandDefinition, listCommandClass, listSubCommands } from './decorator'
import { ConsoleError } from './error/consoleError'
import { Application, ComponentOptions, Context, Middleware, NextFunction } from './interface'
import { delay, keepProcessAlive } from './utils'
import yargs = require('yargs')

function wrapLogger(proto: ILogger) {
    const levels = ['debug', 'info', 'warn', 'error'] as const
    type Level = typeof levels[number]

    return new Proxy(proto, {
        get(target, p, receiver) {
            const result = Reflect.get(target, p, receiver)
            if (levels.includes(p as Level)) {
                return (msg: any, ...args: any[]) => {
                    if (typeof msg === 'string') {
                        msg = `[${NS}] ` + msg
                    }

                    return (result as ILogger[Level]).call(proto, msg, ...args)
                }
            }

            return result
        }
    })
}

const CTX = Symbol('@midway3-components/cli:framework.context')
const CMD = Symbol('@midway3-components/cli:framework.command')
type ParsedArgv = {
    [CTX]?: Context
    [CMD]?: string
}

// https://github.com/midwayjs/midway/blob/main/packages/web-express/src/framework.ts
@Framework()
export class ComponentFramework extends BaseFramework<
    Application,
    Context,
    ComponentOptions,
    NextFunction
> {
    declare app: Application<ParsedArgv>

    configure() {
        return this.configService.getConfiguration('cli')
    }

    async applicationInitialize() {
        this.logger = wrapLogger(this.logger)
        const {
            cwd,
            args = defaultArgv,
            yargs: yargsOptions,
        } = this.configurationOptions

        const theArgs = typeof args === 'function'
            ? await args() : args

        this.logger.debug('create `yargs` app')
        const app = yargs(theArgs, cwd) as Application<ParsedArgv>

        if (yargsOptions != null) {
            Object.entries(yargsOptions)
                .forEach(([k, v]) => {
                    const method = app[k]
                    if (typeof method === 'function') {
                        method.call(app, v)
                    }
                })
        }

        // yargs builtin `help|--version` command hit
        app.exit = (code, err) => {
            if (!this._interactive) {
                this.destroy(code, err)
            }
        }

        // attach context to application to enable exitCode checking for `start()`
        app.middleware((argv) => {
            const ctx = this.app.createAnonymousContext({
                body: null,
                exitCode: 0,
            })
            ctx.logger = wrapLogger(ctx.logger)

            argv[CTX] = ctx

            const [command] = argv._
            argv[CMD] = command as string
        })

        this.app = app
        this.defineApplicationProperties({
            args: theArgs,
            interactive: () => this.interactive(),
            useMiddleware: (x: Middleware) => this.useMiddleware(x)
        })
        this.useMiddleware(async (ctx, next) => {
            try {
                const ret = await next()
                const result = ctx.body ?? ret
                if (result != null) {
                    this.stdout(result)
                }
            } catch (err) {
                if (!(err instanceof ConsoleError)) {
                    // eslint-disable-next-line no-ex-assign
                    err = new ConsoleError(
                        err?.message ?? String(err),
                        typeof err?.exitCode === 'number' ? err.exitCode : undefined,
                        err
                    )
                }

                const { message, exitCode, cause } = err as ConsoleError

                ctx.exitCode = exitCode
                this.stderr(message ?? 'Error occurred.')
                if (cause != null) {
                    this.stderr(cause)
                }
            }
        })

        this.logger.debug('initialized')
    }

    async run(): Promise<void> {
        const commandList = listCommandClass()
        commandList.forEach(
            x => this.registerCommandClass(x)
        )

        if (getCurrentMainFramework() === this) {
            // keep process alive before `start()`
            const clear = keepProcessAlive()
            this.start(clear)
        }
    }

    registerCommandClass(clz: Class) {
        const definition = getCommandDefinition(clz)
        const parentName = this.registerCommand(definition)

        const children = listSubCommands(clz)
        children.forEach(x => this.registerCommand(x, parentName))
    }

    registerCommand(definition: CommandDefinition, parentName?: string) {
        const {
            name: commandName, aliases,
            command, description, deprecated,
            commandClass, commandMethod,
            options: namedOptions, positionals: positionalOptions,
            middlewares
        } = definition

        const theCommandMethod = commandMethod ?? 'exec'

        let theCommand = command
        if (theCommand == null) {
            let theName = commandName != null
                ? commandName : (parentName == null
                    ? identity(commandClass.name, 'Command')
                    : identity(theCommandMethod, 'Command')
                )

            if (parentName != null) {
                theName = theName.includes('/')
                    ? theName : `${parentName}/${theName}`
            }

            const positionals = positionalOptions
                .map(({ name, demandOption }) => demandOption ? `<${name}>` : `[${name}]`)

            theCommand = [theName, ...positionals].join(' ')
            if (aliases != null) {
                theCommand = [theCommand, ...aliases]
            }
        }

        this.logger.info('register command: %s', theCommand)
        const result: string = Array.isArray(theCommand) ? theCommand[0] : theCommand
        if (commandMethod != null || typeof commandClass.prototype[theCommandMethod] === 'function') {
            this.app.command(
                theCommand,
                (description ?? '') as string,
                (args) => {
                    this.logger.info('matched command: %s', result)
                    namedOptions.forEach(x => args.option(x.name, x))
                    positionalOptions.forEach(x => args.positional(x.name, x))
                },
                async (argv) => {
                    const { [CTX]: ctx } = argv
                    if (ctx == null) {
                        throw new Error('Context is not attached.')
                    }
                    ctx.command = result
                    ctx.argv = argv

                    ctx.logger.info('parsed argv: %s', argv)
                    const commandMiddleware = middlewares != null
                        ? await this.middlewareService.compose(middlewares, ctx.getApp())
                        : undefined

                    const rootMiddleware = await this.applyMiddleware(commandMiddleware)
                    await rootMiddleware(ctx, async () => {
                        const commandObj = await ctx.requestContext.getAsync(commandClass)
                        const method = commandObj[theCommandMethod]
                        if (typeof method !== 'function') {
                            throw new Error(`Command method is not defined: ${commandClass.name}.${String(theCommandMethod)}()`)
                        }

                        ;[...namedOptions, ...positionalOptions].forEach(x => {
                            if (x.parameterIndex == null) {
                                const val = argv[x.name]
                                if (val != null) {
                                    commandObj[x.propertyKey] = val
                                }
                            }
                        })

                        const args = argv._.slice(1)
                        return await method.call(commandObj, ctx, ...args)
                    })
                },
                undefined,
                deprecated
            )
        }

        return result.split(' ', 2)[0]
    }

    async start(parsedCb?: () => void) {
        try {
            this.logger.debug('starting..')

            const argv = await this.app.parseAsync()
            parsedCb?.()

            const { command, exitCode } = argv[CTX] ?? {}
            if (command == null) {
                const requestCommand = argv[CMD]
                if (requestCommand == null) {
                    // don't await for `interactive` mode
                    this.interactive().then(
                        x => this.destroy(x ?? 0)
                    )
                    return;
                }

                await this.unknownCommand(requestCommand)
            }

            await this.destroy(exitCode)
        } catch (err) {
            this.destroy(-1, err)
        }
    }

    protected unknownCommand(command: string): void | Promise<void> {
        this.stderr('Unknown command: %s \n\nUsage: ', command)
        this.app.showHelp()
    }

    private _interactive = false
    async interactive() {
        if (this._destroy) return;
        if (this._interactive) return;
        this._interactive = true

        // https://nodejs.org/en/learn/command-line/accept-input-from-the-command-line-in-nodejs
        const dev = createInterface({
            input: process.stdin,
            output: process.stdout,
        })

        const { prompt = defaultPrompt } = this.configurationOptions
        const providePrompt = async () => {
            return typeof prompt === 'function'
                ? await prompt()
                : prompt
        }

        const { app } = this
        let exitCode: number | undefined

        const clearCommands = ['clear', 'cls']
        const exitCommands = ['exit', 'quit', 'bye']

        const run = async () => {
            const promptVal = await providePrompt()
            return await new Promise<void>((resolve) => {
                dev.question(promptVal, async (args) => {
                    try {
                        const argv = await app.parseAsync(args)
                        const { command, exitCode: _exitCode } = argv[CTX] ?? {}
                        if (_exitCode != null) {
                            exitCode = _exitCode
                        }

                        if (command == null) {
                            const requestCommand = argv[CMD]
                            if (requestCommand != null) {
                                if (exitCommands.includes(requestCommand)) {
                                    return resolve()
                                } else if (clearCommands.includes(requestCommand)) {
                                    await this.clear()
                                } else {
                                    await this.unknownCommand(requestCommand)
                                }
                            }
                        }
                    } catch (err) {
                        await this.stderr(err)
                    }

                    resolve(await run())
                })
            })
        }

        await run().finally(() => {
            dev.close()
            this._interactive = false
        })

        return exitCode ?? 0
    }

    private _destroy = false
    async destroy(exitCode = 0, reason?: unknown) {
        this._destroy = true
        this.logger.debug('destroying...')

        process.exitCode = exitCode
        if (reason != null) {
            if (exitCode !== 0) {
                await this.stderr(reason)
            } else {
                await this.stdout(reason)
            }
        }

        try {
            process.kill(process.pid, 'SIGINT')
            // if (process.env.NODE_ENV === 'local') {
            //     if (reason === true) {
            //         process.kill(process.ppid, 'SIGINT')
            //     }
            // }
            await delay(5000)

            const service = await this.applicationContext
                .getAsync(MidwayLifeCycleService)
            await service.stop()
        } catch (err) {
            this.stderr(err)
        } finally {
            process.exit()
        }
    }

    // protected async beforeStop(): Promise<void> {
    //     this.logger.info('stopping...')
    // }

    protected clear(): void | Promise<void> {
        console.clear()
    }

    protected stdout(...args: any): void | Promise<void> {
        console.log(...args)
    }

    protected stderr(...args: any): void | Promise<void> {
        console.error(...args)
    }
}

function defaultArgv() {
    return hideBin(process.argv)
}

function defaultPrompt() {
    return '\n> '
}
