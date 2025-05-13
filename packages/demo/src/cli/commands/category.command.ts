import { Command, ICommand, Positional, SubCommand } from '@midway3-components/cli'
import { ActiveDataProvider } from '@midway3-components/core'
import { Inject } from '@midwayjs/core'
import { CategoryController } from '../../controller/api/category.controller'
import { Category } from '../../entity/category.drizzle'

@Command()
export class CategoryCommand implements ICommand {
    @Inject()
    ctrl: CategoryController

    exec() {
        const query = Category.find((q, t, op) => {
            q.where(op.like(t.name, '%C%'))
        })

        return ActiveDataProvider.create(query)
    }

    @SubCommand()
    async view(
        @Positional('id')
        category_id: number
    ) {
        const result = await Category.findOne({ category_id }, true)
        return result
    }

    @SubCommand()
    async cud() {
        return this.ctrl.cudAction()
    }
}
