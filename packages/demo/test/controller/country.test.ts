import { Framework } from '@midwayjs/koa'
import { close, createApp, createHttpRequest } from '@midwayjs/mock'

describe('test/controller/country.test.ts', () => {

    it('should GET /country', async () => {
        // create app
        const app = await createApp<Framework>()

        // make request
        const result = await createHttpRequest(app).get('/country')

        // use expect by jest
        expect(result.status).toBe(200)
        expect(result.text).toContain('<!-- the country/index view -->')

        // close app
        await close(app)
    })

})
