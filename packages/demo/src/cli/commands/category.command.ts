import { Command, ICommand, Positional, SubCommand } from '@midway3-components/cli'
import { ActiveDataProvider } from '@midway3-components/core'
import { Inject } from '@midwayjs/core'
import { CategoryController } from '../../controller/api/category.controller'
import { Category } from '../../entity/category.drizzle'

@Command()
export class CategoryCommand implements ICommand {
    @Inject()
    ctrl: CategoryController

    exec(ctx: unknown, keyword: string) {
        const query = Category.find((q, t, op) => {
            if (keyword) {
                q.where(op.like(t.name, `%${keyword}%`))
            }
        })

        return ActiveDataProvider.create(query)
    }

    @SubCommand()
    async view(
        @Positional('id')
        category_id: number
    ) {
        // const result = await Category.findOne({ category_id }, true)
        const result = await Category.find()
            .where({ category_id })
            .one()
        return result
    }

    @SubCommand()
    async cud() {
        return this.ctrl.cudAction()
    }
}
