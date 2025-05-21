import { RequestParameters } from '../interface'
import { configure } from '../utils'

export abstract class Parameterized {
    params?: RequestParameters

    configure(options: Partial<this>) {
        return configure(this, options as any)
    }

    getStrValue(name: string, defaultValue = '') {
        const val = this.params?.[name]
        return val != null
            ? String(val) : defaultValue
    }

    getIntValue(name: string, defaultValue = 0) {
        const val = this.getStrValue(name)
        if (val !== '') {
            const result = Number.parseInt(val)
            if (!Number.isNaN(result)) {
                return result
            }
        }

        return defaultValue
    }
}
