import { Command, ICommand, Option, Positional, SubCommand } from '@midway3-components/cli'
import { format } from 'util'

@Command()
export class HelloCommand implements ICommand {
    @Option()
    from = 'A Friend'

    @Positional()
    to = 'World'

    /**
     * ```bash
     * cd packages/demo
     * pnpm build
     *
     * pnpm cli hello --to=Midway.js
     * #OR
     * node ./bootstrap-cli.js hello --to=Midway.js
     * ```
     */
    exec() {
        return format('Hello, %s! - %s', this.to, this.from)
    }

    /**
     * ```bash
     * cd packages/demo
     * pnpm build
     *
     * pnpm demo cli hello/say Midway.js "Greets!"
     * #OR
     * cd packages/demo
     * node ./bootstrap-cli.js hello/say Midway.js "Greets!"
     * ```
     */
    @SubCommand()
    async say(
        // Overwrite options of class member
        @Option('from', { default: 'Billy Poon' })
        from: string,
        // Overwrite options of class member
        @Positional('to', true)
        to: string,
        // Add a new positional option
        @Positional('appendix')
        appendix = '',
    ) {
        return format('Hello, %s! %s - %s', to, appendix, from)
    }
}
