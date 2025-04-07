declare module 'sequelize/lib/utils' {
    export function cloneDeep<T extends object>(obj: T, onlyPlain?: boolean): T
}
