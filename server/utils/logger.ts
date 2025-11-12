import util from 'node:util'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMeta {
  context?: Record<string, unknown>
  error?: unknown
  [key: string]: unknown
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
}

const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

function formatMeta(meta?: LogMeta): string | undefined {
  if (!meta || Object.keys(meta).length === 0) {
    return undefined
  }

  return util.inspect(meta, { depth: 4, colors: false, compact: true })
}

function log(level: LogLevel, message: string, meta?: LogMeta) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[CURRENT_LEVEL]) {
    return
  }

  const timestamp = new Date().toISOString()
  const formattedMeta = formatMeta(meta)
  const output = `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedMeta ? ` | ${formattedMeta}` : ''}`

  switch (level) {
    case 'debug':
    case 'info':
      console.log(output)
      break
    case 'warn':
      console.warn(output)
      break
    case 'error':
      console.error(output)
      break
  }
}

function withContext(baseMeta: LogMeta = {}) {
  return {
    debug(message: string, meta?: LogMeta) {
      log('debug', message, { ...baseMeta, ...meta })
    },
    info(message: string, meta?: LogMeta) {
      log('info', message, { ...baseMeta, ...meta })
    },
    warn(message: string, meta?: LogMeta) {
      log('warn', message, { ...baseMeta, ...meta })
    },
    error(message: string, meta?: LogMeta) {
      log('error', message, { ...baseMeta, ...meta })
    }
  }
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => log('debug', message, meta),
  info: (message: string, meta?: LogMeta) => log('info', message, meta),
  warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
  error: (message: string, meta?: LogMeta) => log('error', message, meta),
  child: withContext
}


