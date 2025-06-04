import { close, createApp } from '@midwayjs/mock'

describe('test of `unknown command`', () => {

  it('should POST /api/get_user', async () => {
    // create app
    const app = await createApp(undefined, {
        baseDir: 'src/cli',
        // entryFile: 'bootstrap-cli.js',
        globalConfig: {
            cli: {
                args: 'hello'
                // args: 'unknown-command'
            }
        }
    });

    // use expect by jest
    // expect(result.status).toBe(200);
    // expect(result.body.message).toBe('OK');

    // close app
    await close(app);
  });
});
