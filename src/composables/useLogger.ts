type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogAPIBackend {
  debug: (source: string, message: string, ...args: any[]) => void
  info: (source: string, message: string, ...args: any[]) => void
  warn: (source: string, message: string, ...args: any[]) => void
  error: (source: string, message: string, ...args: any[]) => void
}

export function useLogger(source: string) {
  const logAPI = (window as any).logAPI as LogAPIBackend | undefined

  function log(level: LogLevel, message: string, ...args: any[]): void {
    if (logAPI) {
      logAPI[level](source, message, ...args)
    } else {
      const tag = `[${source}]`
      if (level === 'error') console.error(tag, message, ...args)
      else if (level === 'warn') console.warn(tag, message, ...args)
      else console.log(tag, message, ...args)
    }
  }

  return {
    debug: (message: string, ...args: any[]) => log('debug', message, ...args),
    info: (message: string, ...args: any[]) => log('info', message, ...args),
    warn: (message: string, ...args: any[]) => log('warn', message, ...args),
    error: (message: string, ...args: any[]) => log('error', message, ...args),
  }
}
