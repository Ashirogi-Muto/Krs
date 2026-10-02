import crypto from 'node:crypto'
import { logger } from '@/lib/logger'

function getSecret(explicitSecret?: string): string {
  const secret = explicitSecret || process.env.PAYLOAD_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: PAYLOAD_SECRET missing in production! Halting auth.')
      throw new Error('PAYLOAD_SECRET environment variable is mandatory in production.')
    }
    return 'krs_dev_fallback_secret_must_be_changed_in_prod_2026'
  }

  return secret
}

export interface JwtClaims {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'JUDGE' | 'PARTICIPANT'
  institution?: string
  phone?: string
  iat?: number
  exp?: number
}

/**
 * Signs a payload into an HMAC SHA-256 JWT
 */
export function signJwt(
  claims: Omit<JwtClaims, 'iat' | 'exp'>,
  explicitSecret?: string,
  expiresInSeconds: number = 7 * 24 * 3600
): string {
  const secret = getSecret(explicitSecret)
  const now = Math.floor(Date.now() / 1000)

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const payload: JwtClaims = {
    ...claims,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const dataToSign = `${headerB64}.${payloadB64}`

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64url')

  return `${dataToSign}.${signature}`
}

/**
 * Cryptographically verifies an HMAC SHA-256 JWT using timing-safe comparison
 * Returns decoded claims if valid and unexpired; returns null otherwise.
 */
export function verifyJwt<T extends JwtClaims = JwtClaims>(
  token: string,
  explicitSecret?: string
): T | null {
  if (!token || typeof token !== 'string') {
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    logger.warn('Auth token format invalid: expected 3 parts')
    return null
  }

  const [headerB64, payloadB64, providedSignature] = parts
  const secret = getSecret(explicitSecret)
  const dataToVerify = `${headerB64}.${payloadB64}`

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToVerify)
    .digest('base64url')

  // Timing-safe comparison to prevent side-channel timing attacks
  const expectedBuf = Buffer.from(expectedSignature, 'utf8')
  const providedBuf = Buffer.from(providedSignature, 'utf8')

  if (expectedBuf.length !== providedBuf.length) {
    logger.warn('Auth token signature length mismatch')
    return null
  }

  if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    logger.warn('Auth token cryptographic signature verification failed')
    return null
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const payload = JSON.parse(payloadJson) as T

    // Verify expiration claim
    if (payload.exp && typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000)
      if (now > payload.exp) {
        logger.warn(`Auth token expired for user ${payload.email}`)
        return null
      }
    }

    // Require essential claims (zero fallback trust)
    if (!payload.id || !payload.email || !payload.role) {
      logger.warn('Auth token missing mandatory identity claims')
      return null
    }

    return payload
  } catch (err: any) {
    logger.warn(`Failed to parse auth token payload: ${err.message}`)
    return null
  }
}
