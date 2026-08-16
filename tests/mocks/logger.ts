import pino from 'pino'

/**
 * src/config/logger.ts の差し替え（jest.config.ts の moduleNameMapper 経由）。
 *
 * 本物は NODE_ENV !== 'production' のとき pino-pretty の transport を使う。
 * transport はワーカースレッドを立てるため、テストではプロセスが終了できなくなる。
 * ここでは transport を持たない silent なインスタンスを返す。
 */
const logger = pino({ level: 'silent' })

export default logger
