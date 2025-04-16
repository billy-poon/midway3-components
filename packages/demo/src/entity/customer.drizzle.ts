import { Column, Entity } from '@midway3-components/drizzle'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../schema/pg'

const {
    customerTable: t,
    addressTable: a,
} = schema

@Entity(t, {
    dataSource: 'postgres',
    joins: [
        { from: a, on: eq(a.addressId, t.addressId) }
    ]
})
export class CustomerEntity {
    @Column(t.customerId)
    id: number

    @Column(sql<string>`concat(${t.firstName}, ' ', ${t.lastName})`)
    fullName: string

    @Column(a.address)
    address: string
}
