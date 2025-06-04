import { ActiveRecordClass, isSQLite, Table } from '@midway3-components/drizzle'
import { categoryTable } from '../schema/pg'

function CreateActiveRecord<T extends Table>(table: T) {
    const name = table.constructor.name
    if (name === 'MySqlTable') {
        return ActiveRecordClass(table, 'mysql')
    } else if (name === 'PgTable') {
        return ActiveRecordClass(table, 'postgres')
    }

    return ActiveRecordClass(table, 'sqlite')
}

export class Category extends CreateActiveRecord(categoryTable) {
    static table() {
        return categoryTable
    }

    static columns() {
        return super.columns()
    }

    static async getById(category_id: number) {
        const result = await Category.findOne({ category_id })
        return result
    }

    protected async beforeInsert(): Promise<boolean> {
        if (await super.beforeInsert()) {
            if (isSQLite(Category.db())) {
                this.category_id = 99
            }
            return true
        }

        return false
    }
}
