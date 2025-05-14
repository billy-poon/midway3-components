import { All, Controller, HttpStatus } from '@midwayjs/core'
import { Context } from '@midwayjs/koa'

@Controller('/.well-known')
export class WellKnownController {
    @All('/*')
    async indexAction(ctx: Context) {
        ctx.status = HttpStatus.NO_CONTENT
        return ''
    }
}
