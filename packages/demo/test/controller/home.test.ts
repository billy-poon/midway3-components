import { Framework } from '@midwayjs/koa'
import { close, createApp, createHttpRequest } from '@midwayjs/mock'

describe('test/controller/home.test.ts', () => {

  it('should GET /', async () => {
    // create app
    const app = await createApp<Framework>();

    // make request
    const result = await createHttpRequest(app).get('/');

    // use expect by jest
    expect(result.status).toBe(200);
    expect(result.text).toBe('Hello Midwayjs!');

    // close app
    await close(app);
  });

});
