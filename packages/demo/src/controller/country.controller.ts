import { ActiveDataProvider } from '@midway3-components/core'
import { ActiveQuery } from '@midway3-components/core/dist/sequelize'
import { Render } from '@midway3-components/web'
import { Controller, Get, Param, Query } from '@midwayjs/core'
import { NotFoundError } from '@midwayjs/core/dist/error/http'
import { Op } from 'sequelize'
import { Country } from '../entity/country.sequelize'

@Controller('/country')
export class CountryController {
    @Get('/')
    @Render({
        locals: { $page_title: 'Countries' }
    })
    async indexAction(
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

    @Get('/:id')
    @Render<Country>((ctx) => ({
        locals: { $page_title: `Country - ${ctx.result.country}` }
    }))
    async viewAction(
        @Param('id')
        country_id: number
    ) {
        const result = await ActiveQuery.create(Country)
            .where({ country_id })
            .one()

        if (result == null) {
            throw new NotFoundError('Country not found: ' + country_id)
        }

        return result
    }
}
