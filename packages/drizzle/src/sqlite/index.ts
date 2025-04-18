import { drizzle } from 'drizzle-orm/libsql'
import { SQLiteDataSourceOptions, SQLiteDrizzle } from './interface'

export function create(options: SQLiteDataSourceOptions): SQLiteDrizzle {
    return drizzle(options)
}
