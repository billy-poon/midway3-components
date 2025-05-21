import { Action, ActiveDataProvider, SerializeService } from '@midway3-components/core'
import { Controller, Get, Inject, Post } from '@midwayjs/core'
import { like } from 'drizzle-orm'
import { Category } from '../../../entity/category.drizzle'
import { CudAction } from './cud.action'

@Controller('/api/category')
export class CategoryController {
    @Inject()
    serializer: SerializeService

    @Get('/')
    async indexAction() {
        const query = Category.find((q, t) => {
            q.where(like(t.name, '%C%'))
        })
        return ActiveDataProvider.create(query)
    }

    @Post('/cud')
    @Action(CudAction)
    async   cudAction() {
    }
}
