import { getCurrentContext } from '@midway3-components/web'
import { getCurrentMainApp, MidwayConfig } from '@midwayjs/core'
import { config } from 'dotenv'

config({
    path: ['.env', `.env-${process.env.NODE_ENV}`]
})

export default {
    // use for cookie sign key, should change to your own and keep security
    keys: '1743411033712_8114',
    koa: {
        port: 7001,
    },
    data: {
        serializer: {
            collectionEnvelope: 'data',
        },
    },
    sequelize: {
        dataSource: {
            default: {
                dialect: 'postgres',
                host: 'localhost',
                // cSpell: ignore pagila
                database: 'pagila',
                username: process.env.DB_USER,
                password: process.env.DB_PASS,

                entities: [
                    'entity'
                ],

                logging(sql: string, options: unknown) {
                    const logger = getCurrentContext()?.getLogger()
                        ?? getCurrentMainApp().getLogger()

                    logger.info(`[sequelize:query] %s\n%o`, sql, options)
                }
            }
        }
    },
} as MidwayConfig
