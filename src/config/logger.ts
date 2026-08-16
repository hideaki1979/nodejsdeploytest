import pino from "pino";

const logger = pino({
    level: process.env.LOG_LEVEL || 'warn',
    /**
     * pino-http はデフォルトのリクエストシリアライザでヘッダを丸ごと出力する。
     * LOG_LEVEL を info 以下に下げるとFirebase IDトークンが平文でログに残るため、
     * 認証情報を含むヘッダはマスクする。
     */
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    transport:
        process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                    // pino-pretty の ignore はカンマ区切りのキー一覧。
                    // ドットはネストしたキーの区切りになるため 'pid.hostname' では抑止されない。
                    ignore: 'pid,hostname'
                }
            } : undefined
})

export default logger
