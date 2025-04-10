import { drizzle } from 'drizzle-orm/libsql'
import { LibSQLDataSourceOptions, LibSQLDrizzle } from './interface'

export function create(options: LibSQLDataSourceOptions): LibSQLDrizzle {
    return drizzle(options)
}
