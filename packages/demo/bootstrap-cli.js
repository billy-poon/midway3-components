const { Bootstrap } = require('@midwayjs/bootstrap');
const { join } = require('path');

process.env.CLI_ENV = process.env.NODE_ENV

function createLogger() {
    const noop = () => { }
    return {
        info: noop,
        debug: noop,
        warn: noop,
        error: console.error
    }
}

async function main() {
    const file = join(__dirname, 'dist/cli/configuration.js')
    const { MainConfiguration } = await import(file)

    Bootstrap
        .configure({
            imports: [MainConfiguration],
            logger: createLogger(),
        })
        .run();
}

main()
