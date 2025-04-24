import { LoggerInfo } from '@midway3-components/core'
import { NS } from '../constants'
import { ConfigurationOptions, Context } from '../interface'

const defaultConfig: ConfigurationOptions = {
    cli: {
        yargs: {
            strictOptions: false
        },
        contextLoggerFormat: (info: LoggerInfo<Context>) => {
            const { command } = info.ctx!
            return `${info.timestamp} ${info.LEVEL} ${info.pid} [${NS} ${command}] ${info.message}`;
        }
    }
}

export default defaultConfig
