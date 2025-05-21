import { FieldDefinition, getFieldDefinitions } from '../decorator/field'
import { applyMixins } from '../utils'

type Class<T = any> = new (...args: any) => T
export type ModelErrors = Record<string, string[]>

export class AbstractModel {
    /** @internal */
    static classType() {
        return classType
    }

    private _errors?: ModelErrors

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async beforeSerialize(fields: string[], expand: string[]) { }

    async serialize(fields: string[], expand: string[]) {
        await this.beforeSerialize(fields, expand)

        const jsonData = typeof this['toJSON'] === 'function'
            ? this['toJSON']([...fields, ...expand])
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
            .filter(x => /^[a-z]/i.test(x))
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
        let result = await jsonData?.[field.propertyKey]
        while (typeof result === 'function') {
            result = await result.call(this)
        }

        if (typeof field.getValue === 'function') {
            result = await field.getValue(result, field, this)
        }

        return result === undefined
            ? field.defaultValue
            : result
    }
}

export class ProxyModel extends AbstractModel {
    constructor(
        readonly data: object
    ) {
        super()
    }

    toJSON() {
        const { data } = this
        return typeof data?.['toJSON'] === 'function'
            ? data['toJSON']()
            : data
    }

    getFieldDefinitions(jsonData: any): FieldDefinition[] {
        return super.getFieldDefinitions.call(this.data, jsonData)
    }
}

const classType = Symbol('@midway3-components/core:model')

interface ModelConstructor {
    new (args: any): AbstractModel
}

export function ModelClass<T extends Class>(superClz: T): ModelConstructor & T
export function ModelClass<T extends Class>(superClz: T) {
    const result = class extends superClz {
        static classType() {
            return classType
        }
    }
    applyMixins(result, [AbstractModel])

    return result
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
