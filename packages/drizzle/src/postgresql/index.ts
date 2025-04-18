import { drizzle } from 'drizzle-orm/node-postgres'
import { PostgresDataSourceOptions, PostgresDrizzle } from './interface'

export function create(options: PostgresDataSourceOptions): PostgresDrizzle {
    return drizzle(options) as any
}
