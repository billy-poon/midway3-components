import { FieldDefinition, getFieldDefinitions } from '../decorator/field'

type Class<T = any> = new (...args: any) => T
export type ModelErrors = Record<string, string[]>

export abstract class AbstractModel extends ModelClass(Object) {
}

type JSONSerializable = {
    toJSON(): unknown
}

export class ProxyModel extends AbstractModel {
    constructor(
        readonly data: object
    ) {
        super()
    }

    toJSON() {
        const result = this.data as JSONSerializable
        return typeof result.toJSON === 'function'
            ? result.toJSON()
            : result
    }

    getFieldDefinitions(jsonData: any): FieldDefinition[] {
        return super.getFieldDefinitions.call(this.data, jsonData)
    }
}

const classType = Symbol('class-type:model')

export function ModelClass<T extends Class>(clz: T) {
    return class extends clz {
        /** @internal */
        static classType() {
            return classType
        }

        /** @private */
        _errors?: ModelErrors

        hasErrors(attribute?: string) {
            const obj = this._errors
            if (obj != null) {
                const count = attribute == null
                    ? Object.keys(obj).length
                    : (obj[attribute] ?? []).length

                return count > 0
            }

            return false
        }

        getErrors(): ModelErrors
        getErrors(attribute: string): string[]
        getErrors(attribute?: string) {
            const obj = this._errors ?? {}
            return attribute == null
                ? obj
                : (obj[attribute] ?? [])
        }

        getFirstErrors() {
            const obj = this.getErrors()
            return Object.entries(obj)
                .filter(([, v]) => v.length > 0)
                .reduce<Record<string, string>>(
                    (res, [k, [v]]) => (res[k] = v, res),
                    {}
                )
        }

        getErrorSummary(showAllErrors: boolean) {
            const errors = showAllErrors
                ? this.getErrors()
                : this.getFirstErrors()

            return Object.values(errors)
                .reduce<string[]>(
                    (res, v) => res.concat(v),
                    []
                )
        }

        addError(attribute: string, error = '') {
            const errors = this._errors ?? {}
            const items = errors[attribute] ?? []
            if (!items.includes(error)) {
                items.push(error)
            }

            errors[attribute] = items
            this._errors = errors
        }

        clearErrors(attribute?: string) {
            if (attribute == null) {
                this._errors = undefined
            } else if (this._errors != null) {
                delete this._errors[attribute]
            }
        }

        async beforeSerialize(fields: string[], expand: string[]) {}

        async serialize(fields: string[], expand: string[]) {
            await this.beforeSerialize(fields, expand)

            const jsonData = typeof this.toJSON === 'function'
                ? this.toJSON([...fields, ...expand])
                : this

            const fieldList = this.getFieldDefinitions(jsonData)
                .filter(x => !x.hidden)
                .map(x => ({
                    ...x,
                    name: x.name ?? String(x.propertyKey)
                }))

            const defaultFields = fieldList.filter(x => !x.extra)
            if (fields.length < 1) {
                fields = defaultFields.map(x => x.name)
            }

            const result: Record<string, unknown> = {}

            for (const x of fields) {
                const field = defaultFields.find(y => y.name === x)
                if (field != null) {
                    result[x] = await this.getValue(field, jsonData)
                }
            }

            for (const x of expand) {
                const field = fieldList.find(y => y.name === x)
                if (field?.extra) {
                    result[x] = await this.getValue(field, jsonData)
                }
            }

            return result
        }

        getFieldDefinitions(jsonData: any): FieldDefinition[] {
            const result = getFieldDefinitions(this)

            Object.keys(jsonData)
                .filter(x => /^[a-zA-Z]/.test(x))
                .filter(x => typeof this[x] !== 'function')
                .forEach(x => {
                    const def = result.find(y => y.propertyKey === x)
                    if (def == null) {
                        result.push({
                            propertyKey: x
                        })
                    }
                })

            return result
        }

        async getValue(field: FieldDefinition, jsonData: any) {
            let value = jsonData?.[field.propertyKey]
            while (typeof value === 'function') {
                value = value.call(this)
            }

            if (typeof field.getValue === 'function') {
                value = field.getValue(await value, field)
            }

            const result = await value
            return result === undefined
                ? field.defaultValue
                : result
        }
    }
}

export function isModel(val: unknown): val is AbstractModel {
    if (val != null && typeof val === 'object') {
        return isModelClass(val.constructor as Class)
    }

    return false
}

export function isModelClass(clz: Class) {
    const theClz = clz as unknown as typeof AbstractModel
    if (typeof theClz.classType === 'function') {
        return theClz.classType() === classType
    }

    return false
}
