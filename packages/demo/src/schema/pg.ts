import { sql } from 'drizzle-orm'
import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

export const actorTable = pgTable('actor', {
    actorId: serial().primaryKey(),
    firstName: varchar({ length: 45 }).notNull(),
    lastName: varchar({ length: 45 }).notNull(),
    lastUpdate: timestamp().notNull().default(sql`current_timestamp() ON UPDATE current_timestamp()`)
})
