import { expect, test } from 'vitest'
import { Context, ICommand } from '../interface'
import { Command, getCommandDefinition } from './command'
import { Option } from './option'
import { Positional } from './positional'
import { listSubCommands, SubCommand } from './subCommand'

@Command()
class TestCommand implements ICommand {
    @Option()
    x: string
    @Positional({ order: 2 })
    z: boolean
    @Positional({ order: 1 })
    y: number

    exec(ctx: Context,
        @Option('o')
        o: unknown,
        @Positional('p')
        p: unknown,
        ...rest: any) {

        return {
            ...this,
            o, p, rest
        }
    }

    @SubCommand()
    subCommand(
        @Option('o')
        o: unknown,
        @Positional('p')
        p: unknown,
        ...rest: any) {

        return {
            ...this,
            o, p, rest
        }
    }
}

test('command-definition', () => {
    const def = getCommandDefinition(TestCommand)

    expect(def.commandMethod).toBe('exec')

    const options = def.options.map(x => x.name)
    expect(options).toEqual(['x', 'o'])

    const positionals = def.positionals.map(x => x.name)
    expect(positionals).toEqual(['p', 'y', 'z'])
})


test('sub-command-definition', () => {
    const items = listSubCommands(TestCommand)
    expect(items.length).toBe(1)

    const [def] = items

    expect(def.commandMethod).toBe('subCommand')

    const options = def.options.map(x => x.name)
    expect(options).toEqual(['x', 'o'])

    const positionals = def.positionals.map(x => x.name)
    expect(positionals).toEqual(['p', 'y', 'z'])
})
