import { Field, Sortable } from '@midway3-components/data'
import { Column, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({
    tableName: 'country',
    timestamps: false
})
@Sortable<Country>({
    attributes: [
        // Make the `country_id` column sortable via query string.
        // With alias name `id`.
        {
            name: 'id',
            propertyKey: 'country_id',
            // And sort DESC by default if not set.
            // default: 'desc',
        },
        // Make the `country` column sortable too.
        'country'
    ]
    // Alternatively, default orders can be specified here.
    // defaultOrder: { id: 'desc' }
})
export class Country extends Model {
    @PrimaryKey
    @Column
    // Define the `country_id` column as field `id`
    @Field('id')
    country_id: number

    @Column
    // The `country` column will be defined as a field sharing the same name
    country: string

    @Column
    // Define the `last_update` column as extra field `lastUpdate`
    // @Field(true)
    // And using `getValue` option to make an async transforming
    @Field({
        name: 'lastUpdate',
        extra: true,
        getValue: async (val: Date | null) => {
            const dayjs = await import('dayjs')
            return val && dayjs(val).format('YYYY-MM-DD HH:mm:ss')
        }
    })
    last_update: Date
}
