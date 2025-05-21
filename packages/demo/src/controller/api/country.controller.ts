import { Action } from '@midway3-components/core'
import { Controller, Get } from '@midwayjs/core'
import { IndexAction } from '../country/index.action'
import { ViewAction } from '../country/view.action'

@Controller('/api/country')
export class CountryController {
    @Get('/')
    @Action(IndexAction)
    async indexAction() { }

    @Get('/:id')
    @Action(ViewAction)
    async viewAction() { }
}
