import * as data from '@midway3-components/data'
import * as drizzle from '@midway3-components/drizzle'
import * as web from '@midway3-components/web'
import { App, Configuration, ILifeCycle } from '@midwayjs/core'
import * as info from '@midwayjs/info'
import * as koa from '@midwayjs/koa'
import * as sequelize from '@midwayjs/sequelize'
import * as validate from '@midwayjs/validate'
import { join } from 'path'
// import { DefaultErrorFilter } from './filter/default.filter';
// import { NotFoundFilter } from './filter/notfound.filter';
import { ReportMiddleware } from './middleware/report.middleware'
import { registerSerializerService } from './service/serializer.service'

@Configuration({
    imports: [
        koa,
        data,
        web,
        validate,
        drizzle,
        sequelize,
        {
            component: info,
            enabledEnvironment: ['local'],
        },
    ],
    importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration implements ILifeCycle {
    @App('koa')
    app: koa.Application

    async onReady() {
        // registerSerializerService()

        // add middleware
        this.app.useMiddleware([
            ReportMiddleware,
            web.ContextMiddleware,
            web.RESTfulMiddleware,
        ])
        // add filter
        // this.app.useFilter([NotFoundFilter, DefaultErrorFilter]);
    }
}

registerSerializerService()
