import fs from 'node:fs'
import path from 'node:path'

const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_ROTATING_FILES = 5

const logsDir = path.resolve(process.cwd(), 'logs')

if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true })
  } catch {
    // Ignore in read-only environments
  }
}

function rotateLogFile(basePath: string) {
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ basePath)) return
    const stats = fs.statSync(basePath)
    if (stats.size < MAX_LOG_SIZE_BYTES) return

    // Rotate oldest files away
    const oldestFile = `${basePath}.${MAX_ROTATING_FILES}`
    if (fs.existsSync(/*turbopackIgnore: true*/ oldestFile)) {
      fs.unlinkSync(oldestFile)
    }

    for (let i = MAX_ROTATING_FILES - 1; i >= 1; i--) {
      const src = `${basePath}.${i}`
      const dst = `${basePath}.${i + 1}`
      if (fs.existsSync(/*turbopackIgnore: true*/ src)) {
        fs.renameSync(src, dst)
      }
    }

    fs.renameSync(basePath, `${basePath}.1`)
  } catch (err) {
    console.error('Error during log rotation:', err)
  }
}

function writeLog(filename: string, level: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const payload = {
    timestamp,
    level,
    message,
    ...(meta ? { meta } : {}),
  }

  const logLine = JSON.stringify(payload) + '\n'

  // Also log to console in non-production
  if (process.env.NODE_ENV !== 'production' || level === 'ERROR') {
    if (level === 'ERROR') {
      console.error(`[${level}] ${timestamp}: ${message}`, meta || '')
    } else {
      console.log(`[${level}] ${timestamp}: ${message}`, meta || '')
    }
  }

  try {
    const filePath = path.join(logsDir, filename)
    rotateLogFile(filePath)
    fs.appendFileSync(filePath, logLine, 'utf8')
  } catch (err) {
    // Failsafe so logging never crashes request handling
    console.error('Failed writing to log file:', err)
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => writeLog('app.log', 'INFO', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => writeLog('app.log', 'WARN', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => writeLog('error.log', 'ERROR', msg, meta),
  audit: (actor: string, action: string, entity: string, entityId: string, meta?: Record<string, unknown>) => {
    writeLog('audit.log', 'AUDIT', `${actor} -> ${action} on ${entity}:${entityId}`, {
      actor,
      action,
      entity,
      entityId,
      ...meta,
    })
  },
}
