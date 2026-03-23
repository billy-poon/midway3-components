import { Command, ConsoleError, ICommand, Positional, SubCommand } from '@midway3-components/cli'
import { ActiveDataProvider } from '@midway3-components/core'
import { Inject } from '@midwayjs/core'
import { CategoryController } from '../../controller/api/category/category.controller'
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

    @SubCommand()
    async transaction() {
        async function print(title: string) {
            console.log(title)

            const xy = await Category
                .find((q, t, op) => {
                    q.where(op.lt(t.category_id, 3))
                })
                .all()
            for (const v of xy) {
                console.log('%d => %s', v.category_id, v.name)
            }
        }

        try {
            await Category.db().transaction(async () => {
                print('before update:')

                const [x, y] = await Category
                    .find((q, t, op) => {
                        q.where(op.lt(t.category_id, 3))
                    })
                    .all()

                x.name += '(updated)'
                await x.save(true)

                y.name += '(updated)'
                await y.save(true)

                print('after update:')

                throw new ConsoleError('Aborted')
            })
        } catch (err) {
            if (err instanceof ConsoleError) {
                console.log(err.message)
            } else {
                throw err
            }
        }

        print('after transaction:')
    }
}
