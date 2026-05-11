import { app } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, writeFileSync, readdirSync, unlinkSync, statSync } from 'fs'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

let minLevel: LogLevel = 'debug'

function getLogDir(): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const devLogDir = join(__dirname, '..', 'src', 'log')
  const prodLogDir = join(app.getPath('userData'), 'logs')
  return app.isPackaged ? prodLogDir : devLogDir
}

function ensureLogDir(): void {
  const logDir = getLogDir()
  mkdirSync(logDir, { recursive: true })
}

function getTodayFilePath(): string {
  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return join(getLogDir(), `${date}.log`)
}

function rotateLogs(): void {
  const logDir = getLogDir()
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  try {
    const files = readdirSync(logDir)
    for (const file of files) {
      if (!file.endsWith('.log')) continue
      const filePath = join(logDir, file)
      try {
        const stat = statSync(filePath)
        if (stat.mtimeMs < sevenDaysAgo) {
          unlinkSync(filePath)
        }
      } catch {
        // ignore individual file errors
      }
    }
  } catch {
    // ignore directory read errors
  }
}

function formatTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const ms = String(now.getMilliseconds()).padStart(3, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`
}

function log(level: LogLevel, source: string, message: string, args: any[]): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) return

  const timestamp = formatTimestamp()
  const formatted = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}`

  if (level === 'error') console.error(formatted, ...args)
  else if (level === 'warn') console.warn(formatted, ...args)
  else console.log(formatted, ...args)

  try {
    const line = args.length ? `${formatted} ${args.map(a => JSON.stringify(a)).join(' ')}` : formatted
    writeFileSync(getTodayFilePath(), line + '\n', { encoding: 'utf-8', flag: 'a' })
  } catch (err) {
    console.error('Failed to write log:', err)
  }
}

export interface Logger {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
  setLevel(level: LogLevel): void
}

export function initLogger(): void {
  ensureLogDir()
  rotateLogs()
}

export function createLogger(source: string): Logger {
  return {
    debug: (message, ...args) => log('debug', source, message, args),
    info: (message, ...args) => log('info', source, message, args),
    warn: (message, ...args) => log('warn', source, message, args),
    error: (message, ...args) => log('error', source, message, args),
    setLevel: (level) => { minLevel = level },
  }
}
