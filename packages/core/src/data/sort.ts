import { SortOptions } from '../interface'
import { Parameterized } from './parameterized'

type AttributeOf<T> = keyof {
    [K in keyof T as T[K] extends Function ? never : K]: unknown
}

export type ORDER = 'asc' | 'desc'

type AttributeOptionsOf<T> = {
    name: string
    propertyKey?: AttributeOf<T> | AttributeOf<T>[]
    asc?: Partial<Record<AttributeOf<T>, ORDER>>
    desc?: Partial<Record<AttributeOf<T>, ORDER>>
    default?: ORDER
    // label?: string
}

export type SortableAttributes<T> = (AttributeOf<T> | AttributeOptionsOf<T>)[]

export class Sort<T = unknown> extends Parameterized implements SortOptions {
    sortParam = 'sort'
    separator: string | RegExp = ','
    enableMultiSort = false

    attributes?: SortableAttributes<T>
    defaultOrder?: Record<string, ORDER>

    getOrders(recalculate = false) {
        const attributeOrders = {
            ...this.defaultOrder,
            ...this.getAttributeOrders(recalculate)
        }
        const attributes = this.getAttributes(false)

        Object.values(attributes).forEach(x => {
            if (x.default != null && attributeOrders[x.name] == null) {
                attributeOrders[x.name] = x.default
            }
        })

        return Object.entries(attributeOrders)
            .reduce(
                (res, [k, v]) => {
                    const options = attributes[k]
                    if (options != null) {
                        let fieldOrders = options[v]
                        if (fieldOrders == null) {
                            const { name, propertyKey: field = name } = options
                            fieldOrders = (Array.isArray(field) ? field : [field])
                                .reduce((_res, x) => (_res[x] = v, _res), {})
                        }

                        return { ...res, ...fieldOrders }
                    }

                    return res
                },
                {} as Record<string, ORDER>
            )
    }

    private _attributes?: Record<string, AttributeOptionsOf<T>>
    protected getAttributes(recalculate = false) {
        if (this._attributes == null || recalculate) {
            this._attributes = (this.attributes ?? [])
                .map(x => typeof x === 'object'
                    ? x : { name: x }
                )
                .reduce(
                    (res, x) => (res[x.name] = x, res),
                    {} as Record<string, AttributeOptionsOf<T>>
                )
        }

        return this._attributes!
    }

    private _attributeOrders?: Record<string, ORDER>
    getAttributeOrders(recalculate = false) {
        if (this._attributeOrders == null || recalculate) {
            this._attributeOrders = {}

            const orders = this.parseSortParam(
                this.getStrValue(this.sortParam)
                    .split(this.separator)
            )

            if (orders.length > 0) {
                const attrs = this.getAttributes(true)

                for (const x of orders) {
                    if (attrs[x.name] == null) continue

                    this._attributeOrders[x.name] = x.order
                    if (!this.enableMultiSort) break
                }
            }
        }

        return this._attributeOrders!
    }

    setAttributeOrders(value: Record<string, ORDER> | null, validate = true) {
        if (value == null || !validate) {
            this._attributeOrders = value ?? undefined
        } else {
            this._attributeOrders = {}

            const attrs = this.getAttributes(true)
            for (const [k, v] of Object.entries(value)) {
                if (attrs[k] == null) continue

                this._attributeOrders[k] = v
                if (!this.enableMultiSort) break
            }
        }
    }

    parseSortParam(value: string[]) {
        return value
            .filter(Boolean)
            .map(x => {
                const desc = x[0] === '-'
                return {
                    name: desc ? x.slice(1) : x,
                    order: (desc ? 'desc' : 'asc') as ORDER,
                }
            })
    }

    toJSON() {
        return this.getAttributeOrders()
    }
}
