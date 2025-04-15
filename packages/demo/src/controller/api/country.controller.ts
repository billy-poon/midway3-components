import { ActiveDataProvider } from '@midway3-components/data'
import { ActiveQuery } from '@midway3-components/data/dist/sequelize'
import { Controller, Get, Param, Query } from '@midwayjs/core'
import { Op } from 'sequelize'
import { Country } from '../../entity/country.sequelize'

@Controller('/api/country')
export class CountryController {
    @Get('/')
    async indexAction(
        @Query('q')
        keyword: string = ''
    ) {
        const query = ActiveQuery
            .create(Country)

        if (keyword !== '') {
            query.where({
                country: {
                    [Op.like]: `%${keyword}%`
                }
            })
        }

        return ActiveDataProvider.create(query)
    }

    @Get('/:id')
    async viewAction(
        @Param('id')
        country_id: number
    ) {
        return Country.findOne({
            where: {
                country_id
            }
        })
    }
}
