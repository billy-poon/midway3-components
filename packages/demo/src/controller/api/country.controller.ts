import { ActiveDataProvider } from '@midway3-components/data'
import { Controller, Get, Param, Query } from '@midwayjs/core'
import { Op } from 'sequelize'
import { ActiveQuery } from '../../db/activeQuery'
import { Country } from '../../entity/country.entity'

@Controller('/api/country')
export class CountryController {
    @Get('/')
    async indexAction(
        @Query('q')
        keyword: string = ''
    ) {
        const query = ActiveQuery
            .create(Country)
            // .orderBy({ country_id: 'asc' })

        if (keyword !== '') {
            query.where({
                country: {
                    [Op.like]: `%${keyword}%`
                }
            })
        }

        const result = ActiveDataProvider.create(query)
        // result.setSort(false)
        // result.setPatination(false)

        return result
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
