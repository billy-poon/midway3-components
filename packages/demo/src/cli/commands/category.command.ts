import { Command, ICommand } from '@midway3-components/cli'
import { Category } from '../../entity/category.drizzle'

@Command()
export class CategoryCommand implements ICommand {
    exec() {
        return Category.find((q, t, op) => {
            q.where(op.like(t.name, '%C%'))
        }).all()
    }
}
