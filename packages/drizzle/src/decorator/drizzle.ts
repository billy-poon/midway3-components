import { createCustomPropertyDecorator, MidwayDecoratorService } from '@midwayjs/core'
import { Drizzle } from '../drizzle'

const key = '@midway3-components/drizzle:decorator:inject-drizzle'

type Meta = {
    dataSourceName?: string
}

export function InjectDrizzle(dataSourceName?: string) {
    return createCustomPropertyDecorator(key, { dataSourceName })
}

export function registerInjectDrizzleHandler(
    decoratorService: MidwayDecoratorService,
    factory: (dataSourceName?: string) => Drizzle
) {
    decoratorService.registerPropertyHandler(key, (_propertyKey, meta: Meta) => {
        const { dataSourceName } = meta
        return factory(dataSourceName)
    })
}
