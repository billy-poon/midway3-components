import { Field } from '@midway3-components/core'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class City {
    @PrimaryGeneratedColumn()
    city_id: number

    @Column()
    city: string

    @Column()
    country_id: number

    @Column()
    @Field(true)
    last_update: Date
}
