import { Render } from '@midway3-components/web'
import { Controller, Get } from '@midwayjs/core'

@Controller('/')
export class HomeController {
    @Get('/')
    @Render()
    async indexAction(): Promise<string> {
      return 'Hello Midwayjs!';
    }
}
