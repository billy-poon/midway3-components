
export type Links = {
    [K: string]: string | Link | Links
}

export class Link {
    static readonly REL_SELF = 'self'

    href?: string
    name?: string
    type?: string
    templated = false
    profile?: string
    title?: string
    hreflang?: string

    static serialize(links: Links) {
        const result: Links = {}
        Object.entries(links)
            .forEach(([k, v]) => {
                if (v == null) return;
                if (v instanceof Link) {
                    result[k] = v
                } else if (typeof v === 'object') {
                    result[k] = this.serialize(v)
                } else {
                    result[k] = { href: v }
                }
            })

        return result
    }
}
