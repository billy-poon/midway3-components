import * as core from '@midway3-components/core'
import * as drizzle from '@midway3-components/drizzle'
import * as web from '@midway3-components/web'
import { App, Configuration, ILifeCycle } from '@midwayjs/core'
import * as info from '@midwayjs/info'
import * as koa from '@midwayjs/koa'
import * as sequelize from '@midwayjs/sequelize'
import * as typeorm from '@midwayjs/typeorm'
import * as validate from '@midwayjs/validate'
import * as nunjucks from '@midwayjs/view-nunjucks'
import { join } from 'path'
// import { DefaultErrorFilter } from './filter/default.filter';
// import { NotFoundFilter } from './filter/notfound.filter';
import { ReportMiddleware } from './middleware/report.middleware'
import { registerSerializerService } from './service/serializer.service'

@Configuration({
    imports: [
        koa,
        core,
        web,
        validate,
        typeorm,
        drizzle,
        sequelize,
        nunjucks,
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
            core.ContextMiddleware,
            {
                middleware: web.RESTfulMiddleware,
                options: { match: /^\/api\// },
            },
        ])
        // add filter
        // this.app.useFilter([NotFoundFilter, DefaultErrorFilter]);
    }
}

registerSerializerService()
