import { drizzle } from 'drizzle-orm/mysql2'
import { MySQL2DataSourceOptions, MySQL2Drizzle } from './interface'

export function create(options: MySQL2DataSourceOptions): MySQL2Drizzle {
    return drizzle(options)
}
