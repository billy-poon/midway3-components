import type { DataSourceManagerConfigOption } from '@midwayjs/core'
import type { DrizzleDataSourceOptions } from './drizzle'

export type DrizzleConfigOptions = DataSourceManagerConfigOption<DrizzleDataSourceOptions, never>

export interface ConfigurationOptions {
    drizzle: DrizzleConfigOptions
}
