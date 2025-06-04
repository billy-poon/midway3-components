import { KeyOf } from '../interface'
import { getEntries } from '../utils'
import { Field, FieldOptions } from './field'

export interface ModelOptions<T> {
    fields?: string[] | Record<KeyOf<T>, FieldOptions>
    extraFields?: KeyOf<T>[]
    hiddenFields?: KeyOf<T>[]
}

export function Model<T = unknown>(options: ModelOptions<T>): ClassDecorator {
    const { fields, extraFields, hiddenFields } = options
    return (target) => {
        if (Array.isArray(fields)) {
            fields.forEach(x => {
                Field()(target, x)
            })
        } else if (typeof fields === 'object') {
            getEntries(fields).forEach(([k, v]) => {
                Field(v)(target, k)
            })
        }

        if (Array.isArray(extraFields)) {
            extraFields.forEach(x => {
                Field({ extra: true })(target, x)
            })
        }

        if (Array.isArray(hiddenFields)) {
            hiddenFields.forEach(x => {
                Field({ hidden: true })(target, x)
            })
        }
    }
}
