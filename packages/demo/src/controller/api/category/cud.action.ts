import { IAction, SerializeService } from '@midway3-components/core'
import { BaseModel } from '@midway3-components/core/dist/data'
import { Body, Inject, Provide } from '@midwayjs/core'
import { Rule, RuleType } from '@midwayjs/validate'
import { Category } from '../../../entity/category.drizzle'

// extends from `AbstractModel` to store validation error
class CreateDTO extends BaseModel {
    @Rule(RuleType.required().label('Name'))
    name: string
}

@Provide()
export class CudAction implements IAction {
    @Inject()
    serializer: SerializeService

    async run(
        @Body()
        body: CreateDTO
    ) {
        let ret: unknown

        const model = new Category()
        model.configure(body)
        ret = await model.save()
        const created = {
            model: await this.serializer.serialize(model),
            return: await this.serializer.serialize(ret),
        }

        model.configure({
            name: 'Home Made',
            category_id: model.category_id * -1,
        })
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
