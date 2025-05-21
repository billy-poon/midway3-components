import { Action } from '@midway3-components/core'
import { Render } from '@midway3-components/web'
import { Controller, Get } from '@midwayjs/core'
import { Context } from '@midwayjs/koa'
import { Country } from '../../entity/country.sequelize'
import { IndexAction } from './index.action'
import { ViewAction } from './view.action'

@Controller('/country')
export class CountryController {
    @Get('/')
    @Render({
        locals: { $page_title: 'Countries' }
    })
    @Action(IndexAction)
    async indexAction() { }

    @Get('/:id')
    @Render<Country>((ctx) => ({
        locals: { $page_title: `Country - ${ctx.result.country}` }
    }))
    @Action(ViewAction)
    async viewAction(ctx: Context, result: Country) {
        const data = result.toJSON()
        return Object.entries(data)
            .map(([key, value]) => ({ key, value }))
    }
}
