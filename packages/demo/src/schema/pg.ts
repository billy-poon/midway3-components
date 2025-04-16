import { sql } from 'drizzle-orm'
import { boolean, date, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const actorTable = pgTable('actor', {
    actorId: serial().primaryKey(),
    firstName: varchar({ length: 45 }).notNull(),
    lastName: varchar({ length: 45 }).notNull(),
    lastUpdate: timestamp().notNull().default(sql`current_timestamp() ON UPDATE current_timestamp()`)
})

export const customerTable = pgTable('customer', {
    customerId: serial().primaryKey(),
    storeId: integer().notNull(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text(),
    addressId: integer().notNull(),
    activebool: boolean().notNull(),
    createDate: date().notNull(),
    lastUpdate: timestamp(),
    active: integer()
})

export const addressTable = pgTable('address', {
    addressId: serial().primaryKey(),
    address: text().notNull(),
    address2: text(),
    district: text().notNull(),
    cityId: integer().notNull(),
    postalCode: text(),
    phone: text().notNull(),
    lastUpdate: timestamp(),
})
