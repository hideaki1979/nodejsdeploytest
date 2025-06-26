import { Logger as PinoLogger, Level } from 'pino'

declare module 'pino' {
    interface Logger extends PinoLogger {
        (child: Record<string, unknown>, options?: { level?: Level }): PinoLogger
    }
}
