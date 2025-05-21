import { IAction } from '@midway3-components/core'
import { ActiveQuery } from '@midway3-components/core/dist/sequelize'
import { Param, Provide } from '@midwayjs/core'
import { NotFoundError } from '@midwayjs/core/dist/error/http'
import { Country } from '../../entity/country.sequelize'

@Provide()
export class ViewAction implements IAction {
    async run(
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
