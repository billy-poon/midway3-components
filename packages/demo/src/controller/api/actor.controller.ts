import { ActiveDataProvider } from '@midway3-components/core'
import { ActiveQuery, Drizzle, InjectDrizzle } from '@midway3-components/drizzle'
import { Controller, Get, Query } from '@midwayjs/core'
import { like, or } from 'drizzle-orm'

// import { actorTable } from '../../schema/pg'
// import { actorTable } from '../../schema/mysql'

@Controller('/api/actor')
export class ActorController {
    @InjectDrizzle('postgres')
    pg: Drizzle

    @InjectDrizzle('mysql')
    mysql: Drizzle

    @Get('/')
    async indexAction(
        @Query('q')
        keyword = '',
        @Query('from')
        from?: string,
    ) {
        const { select, table } = from === 'mysql'
            ? await this.mysqlQuery()
            : await this.pgQuery()

        const query = ActiveQuery.create(select)

        if (keyword !== '') {
            select.where(or(
                like(table.firstName, `%${keyword}%`),
                like(table.lastName, `%${keyword}%`),
            ))
        }

        return ActiveDataProvider.create(query)
    }

    async pgQuery() {
        const { actorTable } = await import('../../schema/pg')
        return {
            select: this.pg.select().from(actorTable),
            table: actorTable
        }
    }

    async mysqlQuery() {
        const { actorTable } = await import('../../schema/mysql')
        return {
            select: this.mysql.select().from(actorTable),
            table: actorTable
        }
    }
}
