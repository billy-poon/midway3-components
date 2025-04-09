import { Controller, Get, Redirect } from '@midwayjs/core'

@Controller('/')
export class HomeController {
  // @Get('/')
  // async home(): Promise<string> {
  //   return 'Hello Midwayjs!';
  // }

  @Get('/')
  @Redirect('/api/country')
  async indexAction() {

  }
}
