import { getCurrentContext } from '@midway3-components/web'
import { getCurrentMainApp, MidwayConfig } from '@midwayjs/core'
import { config } from 'dotenv'
import { Logger } from 'drizzle-orm'
import { resolve } from 'path'

config({
    path: ['.env', `.env-${process.env.NODE_ENV}`]
})

const { DB_USER, DB_PASS } = process.env

function drizzleLogger(dataSourceName: string): Logger {
    return {
        logQuery(query: string, params: unknown) {
            const logger = getCurrentContext()?.getLogger()
                ?? getCurrentMainApp().getLogger()

            logger.info(`[drizzle:${dataSourceName}] %s\n%o`, query, params)
        }
    }
}

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
    drizzle: {
        default: {
            casing: 'snake_case'
        },
        dataSource: {
            postgres: {
                // https://wiki.postgresql.org/wiki/Sample_Databases
                connection: `postgresql://${DB_USER}:${DB_PASS}@localhost/pagila`,
                logger: drizzleLogger('postgresql'),
            },
            mysql: {
                // https://dev.mysql.com/doc/sakila/en/sakila-installation.html
                connection: `mysql://${DB_USER}:${DB_PASS}@localhost/sakila`,
                logger: drizzleLogger('mysql'),
            },
            sqlite: {
                // https://github.com/bradleygrant/sakila-sqlite3
                connection: `file://${resolve(__dirname, '../../db/sakila.db')}`
            }
        }
    },
    typeorm: {
        dataSource: {
            default: {
                type: 'mysql',
                host: 'localhost',
                database: 'sakila',
                username: DB_USER,
                password: DB_PASS,

                entities: ['entity/**/*.typeorm.{j,t}s'],

                logger: 'advanced-console',
                logging: 'all',
            }
        }
    },
    sequelize: {
        dataSource: {
            default: {
                dialect: 'postgres',
                host: 'localhost',
                database: 'pagila',
                username: DB_USER,
                password: DB_PASS,

                entities: ['entity/**/*.sequelize.{j,t}s'],

                logging(sql: string, options: unknown) {
                    const logger = getCurrentContext()?.getLogger()
                        ?? getCurrentMainApp().getLogger()

                    logger.info(`[sequelize:query] %s\n%o`, sql, options)
                }
            }
        }
    },
    midwayLogger: {
        default: {
            level: 'info',
        }
    }
} as MidwayConfig
