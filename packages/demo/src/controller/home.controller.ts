import { Controller, Get } from '@midwayjs/core'

@Controller('/')
export class HomeController {
    @Get('/')
    async indexAction(): Promise<string> {
      return 'Hello Midwayjs!';
    }
}
