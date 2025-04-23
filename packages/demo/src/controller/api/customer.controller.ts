import { ActiveDataProvider } from '@midway3-components/core'
import { ActiveQuery } from '@midway3-components/drizzle'
import { Controller, Get } from '@midwayjs/core'
import { CustomerEntity } from '../../entity/customer.drizzle'

@Controller('/api/customer')
export class CustomerController {
    @Get('/')
    async indexAction() {
        const query = ActiveQuery.create(CustomerEntity)
        return ActiveDataProvider.create(query)
    }
}
