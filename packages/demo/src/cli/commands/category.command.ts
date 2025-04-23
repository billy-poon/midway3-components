import { Command, ICommand, SubCommand } from '@midway3-components/cli'
import { Inject } from '@midwayjs/core'
import { CategoryController } from '../../controller/api/category.controller'
import { Category } from '../../entity/category.drizzle'

@Command()
export class CategoryCommand implements ICommand {
    @Inject()
    ctrl: CategoryController

    exec() {
        return Category.find((q, t, op) => {
            q.where(op.like(t.name, '%C%'))
        }).all()
    }

    @SubCommand()
    async cud() {
        return this.ctrl.cudAction()
    }
}
