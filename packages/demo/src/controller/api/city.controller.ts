import { ActiveDataProvider } from '@midway3-components/data'
import { ActiveQuery } from '@midway3-components/data/dist/typeorm'
import { Controller, Get } from '@midwayjs/core'
import { InjectEntityModel } from '@midwayjs/typeorm'
import { Repository } from 'typeorm'
import { City } from '../../entity/city.typeorm'

@Controller('/api/city')
export class CityController {
    @InjectEntityModel(City)
    repo: Repository<City>

    @Get('/')
    indexAction() {
        const query = ActiveQuery.create(this.repo)
        return ActiveDataProvider.create(query)
    }
}
