import { sql } from 'drizzle-orm'
import { mysqlTable, serial, timestamp, varchar } from 'drizzle-orm/mysql-core'

export const actorTable = mysqlTable('actor', {
    actor_id: serial().primaryKey(),
    first_name: varchar({ length: 45 }).notNull(),
    last_name: varchar({ length: 45 }).notNull(),
    last_update: timestamp().notNull().default(sql`current_timestamp() ON UPDATE current_timestamp()`)
})
