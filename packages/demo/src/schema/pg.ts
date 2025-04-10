import { sql } from 'drizzle-orm'
import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

export const actorTable = pgTable('actor', {
    actor_id: serial().primaryKey(),
    first_name: varchar({ length: 45 }).notNull(),
    last_name: varchar({ length: 45 }).notNull(),
    last_update: timestamp().notNull().default(sql`current_timestamp() ON UPDATE current_timestamp()`)
})
