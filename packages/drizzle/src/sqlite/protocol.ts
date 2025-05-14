export const sqliteProtocols = ['wss',  'ws',  'https',  'http',  'file'] as const
export type SQLiteProtocolType = typeof sqliteProtocols[number]
