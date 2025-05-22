import { ActiveDataProvider, IAction } from '@midway3-components/core'
import { ActiveQuery } from '@midway3-components/core/dist/sequelize'
import { Provide, Query } from '@midwayjs/core'
import { Context } from '@midwayjs/koa'
import { Op } from 'sequelize'
import { Country } from '../../entity/country.sequelize'

@Provide()
export class IndexAction implements IAction {
    async run(
        ctx: Context,
        @Query('q')
        keyword = ''
    ) {
        const query = ActiveQuery.create(Country)
        if (keyword !== '') {
            query.where({
                country: { [Op.like]: `%${keyword}%` }
            })
        }

        return ActiveDataProvider.create(query)
    }
}
