export class ConsoleError extends Error {
    constructor(
        message?: string,
        readonly exitCode = -1,
        readonly cause?: unknown,
    ) {
        super(message)
    }
}
