import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const actorTable = sqliteTable('actor', {
    actorId: integer().primaryKey({ autoIncrement: true }),
    firstName: text({ length: 45 }).notNull(),
    lastName: text({ length: 45 }).notNull(),
    lastUpdate: text().notNull().default(sql`datetime('now')`)
})


export const categoryTable = sqliteTable('category', {
    category_id: integer().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    lastUpdate: text().notNull().default(sql`datetime('now')`)
})
