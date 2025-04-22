import { Command, ICommand, NamedOption, PositionOption, SubCommand } from '@midway3-components/cli'
import { format } from 'util'

@Command()
export class HelloCommand implements ICommand {
    @NamedOption()
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
        return format('Hello, %s!', this.to)
    }

    /**
     * ```bash
     * cd packages/demo
     * pnpm build
     *
     * pnpm cli hello/say --to=Midway.js --from="Billy Poon"
     * #OR
     * node ./bootstrap-cli.js hello/say --to=Midway.js --from="Billy Poon"
     * ```
     */
    @SubCommand()
    async say(
        @NamedOption('from', { demandOption: true })
        from: string,
        @PositionOption('appendix')
        appendix = ''
    ) {
        return format('Hello, %s! %s - %s', this.to, appendix, from)
    }
}
