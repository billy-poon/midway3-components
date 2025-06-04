import { Model } from 'sequelize'
import { Class } from '../interface'

export type ModelConstructor<T extends Model> = Class<T> & typeof Model
export type ModelOf<T extends ModelConstructor<any>> = T extends ModelConstructor<infer P>
    ? (P extends Model ? P : never)
    : never
