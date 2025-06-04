import { ArrayDataProvider, configure, DataStore, QueryInterface } from '@midway3-components/core'
import { RESTful, RESTfulController, RESTfulFrom } from '@midway3-components/web'
import { Rule, RuleType } from '@midwayjs/validate'

interface Person {
    id: number
    name: string
    gender: number
}

class EditForm implements RESTfulFrom<Person> {
    @Rule(RuleType.string().required())
    name: string

    @Rule(RuleType.number())
    gender: number

    apply(model: Person) {
        return configure(model, this)
    }
}

let idSeed = 0
class PeopleStore implements DataStore<Person> {
    constructor(
        readonly items: Person[] = []
    ) {}

    init(): Person {
        return {} as any
    }

    query(): QueryInterface<Person> {
        throw new Error('Not supported.')
    }

    get(cond: unknown) {
        return this.items.find(x => x.id == cond) ?? null
    }

    save(data: Person) {
        const item = this.get(data.id)
        if (item != null) {
            configure(item, data)
            return item
        }

        if (data.id == null) {
            data.id = ++idSeed
        }

        this.items.push(data)
        return data
    }

    delete(data: Person) {
        const index = this.items.findIndex(x => x.id === data.id)
        if (index >= 0) {
            this.items.splice(index, 1)
        }
    }
}

const peopleStore = new PeopleStore()

@RESTful('/rest/people')
export class PeopleController extends RESTfulController(peopleStore, { editBodyClz: EditForm }) {
    async indexAction() {
        const { items } = peopleStore
        return new ArrayDataProvider(items)
    }
}
