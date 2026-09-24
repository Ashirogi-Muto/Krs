import crypto from 'node:crypto'
import { logger } from '@/lib/logger'

export interface CreateOrderParams {
  amount: number // in smallest currency unit (e.g. paise)
  currency: string
  receipt: string
  notes?: Record<string, string>
}

export interface OrderResult {
  orderId: string
  amount: number
  currency: string
  provider: string
}

export interface VerificationParams {
  orderId: string
  paymentId: string
  signature: string
}

export interface PaymentProvider {
  name: string
  createOrder(params: CreateOrderParams): Promise<OrderResult>
  verifyPayment(params: VerificationParams): Promise<boolean>
}

class MockPaymentProvider implements PaymentProvider {
  name = 'mock'

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: Mock payment createOrder called in production!')
      throw new Error('Mock payment provider is strictly forbidden in production.')
    }

    logger.info(`[MOCK PAYMENT] Order created for ${params.receipt}: ${params.amount} ${params.currency}`)
    return {
      orderId: `mock_order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      amount: params.amount,
      currency: params.currency,
      provider: 'mock',
    }
  }

  async verifyPayment(params: VerificationParams): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: Attempt to verify mock payment in production! Fails closed.')
      // A mock payment can NEVER create a production CONFIRMED registration.
      return false
    }

    logger.info(`[MOCK PAYMENT] Verifying payment ${params.paymentId} for order ${params.orderId}`)
    return params.signature.startsWith('mock_sig_')
  }
}

class RazorpayPaymentProvider implements PaymentProvider {
  name = 'razorpay'

  private keyId: string
  private keySecret: string

  constructor() {
    this.keyId = process.env.PAYMENT_KEY_ID || ''
    this.keySecret = process.env.PAYMENT_KEY_SECRET || ''

    if (!this.keyId || !this.keySecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Razorpay credentials missing in production environment.')
      }
    }
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    if (!this.keyId || !this.keySecret) {
      throw new Error('Payment gateway not configured. Registration cannot proceed to payment.')
    }

    // Call Razorpay API with server credentials
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      logger.error(`Razorpay order creation failed: ${errText}`)
      throw new Error('Failed to create payment order')
    }

    const data = await response.json()
    return {
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      provider: 'razorpay',
    }
  }

  async verifyPayment(params: VerificationParams): Promise<boolean> {
    if (!this.keySecret) {
      logger.error('Cannot verify payment: Key secret missing.')
      return false
    }

    // Server-side HMAC SHA256 signature verification
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest('hex')

    const matches = crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(params.signature, 'utf8')
    )

    if (matches) {
      logger.audit('SYSTEM', 'PAYMENT_VERIFIED', 'Payment', params.paymentId, { orderId: params.orderId })
    } else {
      logger.warn(`Payment signature mismatch for order ${params.orderId}`)
    }

    return matches
  }
}

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || (process.env.NODE_ENV === 'production' ? 'razorpay' : 'mock')

  if (provider === 'mock') {
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: Mock payment provider configured in production! Failing closed.')
      throw new Error('Production payment provider required. Mock provider is not allowed.')
    }
    return new MockPaymentProvider()
  }

  if (provider === 'razorpay') {
    return new RazorpayPaymentProvider()
  }

  throw new Error(`Unsupported payment provider: ${provider}`)
}
