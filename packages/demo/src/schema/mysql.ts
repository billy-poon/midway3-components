import { sql } from 'drizzle-orm'
import { mysqlTable, serial, text, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const actorTable = mysqlTable('actor', {
    actorId: serial().primaryKey(),
    firstName: varchar({ length: 45 }).notNull(),
    lastName: varchar({ length: 45 }).notNull(),
    lastUpdate: timestamp().notNull().default(sql`current_timestamp() ON UPDATE current_timestamp()`)
})


export const categoryTable = mysqlTable('category', {
    category_id: serial().primaryKey(),
    name: text().notNull(),
    lastUpdate: timestamp(),
})
