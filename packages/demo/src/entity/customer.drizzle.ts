import { Column, Entity } from '@midway3-components/drizzle'
import { getCurrentContext } from '@midway3-components/web'
import { Context } from '@midwayjs/koa'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../schema/pg'

const {
    customerTable: t,
    addressTable: a,
} = schema

function getIndex() {
    const ctx = getCurrentContext() as Context
    if (ctx != null) {
        return ctx.state.index = (ctx.state.index ?? 0) + 1
    }
}

@Entity<CustomerEntity>(t, {
    dataSource: 'postgres',
    joins: [
        { from: a, on: eq(a.addressId, t.addressId) }
    ],
    onLoad: x => x.index = getIndex()
})
export class CustomerEntity {
    @Column(t.customerId)
    id: number

    @Column(sql<string>`concat(${t.firstName}, ' ', ${t.lastName})`)
    fullName: string

    @Column(a.address)
    address: string

    index?: number
}
