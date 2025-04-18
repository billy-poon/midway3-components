export const dialects = ['mysql', 'postgresql', 'sqlite'] as const
export type DialectType = (typeof dialects)[number]
