import { ActiveDataProvider, SerializerService } from '@midway3-components/data'
import { Controller, Get, Inject, Post } from '@midwayjs/core'
import { like } from 'drizzle-orm'
import { Category } from '../../entity/category.drizzle'

@Controller('/api/category')
export class CategoryController {
    @Inject()
    serializer: SerializerService

    @Get('/')
    async indexAction() {
        const query = Category.find((q, t) => {
            q.where(like(t.name, '%C%'))
        })
        return ActiveDataProvider.create(query)
    }

    @Post('/cud')
    async cudAction() {
        let ret: unknown

        const model = new Category()
        model.name = 'Custom'
        ret = await model.save()
        const created = {
            model: await this.serializer.serialize(model),
            return: await this.serializer.serialize(ret),
        }

        model.name = 'Home Made'
        ret = await model.save()
        const updated = {
            model: await this.serializer.serialize(model),
            return: await this.serializer.serialize(ret),
        }

        ret = await model.refresh()
        const refresh = {
            model: await this.serializer.serialize(model),
            return: await this.serializer.serialize(ret),
        }

        ret = await model.delete()
        const deleted = {
            model: await this.serializer.serialize(model),
            return: await this.serializer.serialize(ret),
        }

        return {
            created, updated, refresh, deleted
        }
    }
}
