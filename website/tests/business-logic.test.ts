import test from 'node:test'
import assert from 'node:assert/strict'
import { SEED_AURIX_EVENTS } from '../src/lib/data/seed-events'
import { getPaymentProvider } from '../src/lib/payments'
import { logger } from '../src/lib/logger'

test('AURIX Event Specifications & Pre-Flight Invariants', async (t) => {
  // Values below mirror the owner-confirmed seed data (2 Oct 2026); the live values are edited in the CMS.
  await t.test('Hackathon allows 1 to 5 participants and fee is 749', () => {
    const hackathon = SEED_AURIX_EVENTS.find((e) => e.slug === 'hackathon')
    assert.ok(hackathon, 'Hackathon event must exist')
    assert.equal(hackathon.minTeamSize, 1, 'Hackathon min team size must be 1')
    assert.equal(hackathon.maxTeamSize, 5, 'Hackathon max team size must be 5')
    assert.equal(hackathon.registrationFee, 749)
  })

  await t.test('Robo Soccer enforces 1 to 3 team members and fee is 499', () => {
    const soccer = SEED_AURIX_EVENTS.find((e) => e.slug === 'robo-soccer')
    assert.ok(soccer, 'Robo Soccer must exist')
    assert.equal(soccer.minTeamSize, 1)
    assert.equal(soccer.maxTeamSize, 3)
    assert.equal(soccer.registrationFee, 499)
  })

  await t.test('Robo Race has 1 operator and teams of 1 to 3', () => {
    const race = SEED_AURIX_EVENTS.find((e) => e.slug === 'robo-race')
    assert.ok(race, 'Robo Race must exist')
    assert.equal(race.operatorCount, 1, 'Robo Race must specify exactly 1 operator')
    assert.equal(race.minTeamSize, 1)
    assert.equal(race.maxTeamSize, 3)
    assert.equal(race.registrationFee, 499)
  })

  await t.test('Robo Expo enforces 2 to 4 team members and rubric totals 100', () => {
    const expo = SEED_AURIX_EVENTS.find((e) => e.slug === 'robo-expo')
    assert.ok(expo, 'Robo Expo must exist')
    assert.equal(expo.minTeamSize, 2)
    assert.equal(expo.maxTeamSize, 4)
    assert.equal(expo.registrationFee, 499)

    const totalRubric = (expo.judgingCriteria || []).reduce((acc, c) => acc + c.maxScore, 0)
    assert.equal(totalRubric, 100, 'Robo Expo rubric criteria must sum to 100')
  })

  await t.test('Robo Ideathon enforces max 5 team members and rubrics total 100', () => {
    const ideathon = SEED_AURIX_EVENTS.find((e) => e.slug === 'robo-ideathon')
    assert.ok(ideathon, 'Robo Ideathon must exist')
    assert.equal(ideathon.minTeamSize, 1)
    assert.equal(ideathon.maxTeamSize, 5)
    assert.equal(ideathon.registrationFee, 399)

    const totalRubric = (ideathon.judgingCriteria || []).reduce((acc, c) => acc + c.maxScore, 0)
    assert.equal(totalRubric, 100, 'Robo Ideathon rubric criteria must sum to 100')
  })
})

test('Team Validation Business Rules', async (t) => {
  function validateTeamRoster(
    event: { minTeamSize: number | null; maxTeamSize: number | null; operatorCount?: number },
    memberCount: number,
    operatorCount?: number
  ): { valid: boolean; reason?: string } {
    if (event.operatorCount !== undefined && operatorCount !== undefined) {
      if (operatorCount !== event.operatorCount) {
        return { valid: false, reason: `Requires exactly ${event.operatorCount} designated operator(s)` }
      }
    }

    if (event.minTeamSize !== null && memberCount < event.minTeamSize) {
      return { valid: false, reason: `Minimum team size is ${event.minTeamSize}` }
    }

    if (event.maxTeamSize !== null && memberCount > event.maxTeamSize) {
      return { valid: false, reason: `Maximum team size is ${event.maxTeamSize}` }
    }

    return { valid: true }
  }

  await t.test('Validates Hackathon team composition', () => {
    const hackathon = { minTeamSize: 1, maxTeamSize: 5 }
    assert.equal(validateTeamRoster(hackathon, 0).valid, false)
    assert.equal(validateTeamRoster(hackathon, 6).valid, false)
    assert.equal(validateTeamRoster(hackathon, 1).valid, true)
    assert.equal(validateTeamRoster(hackathon, 5).valid, true)
  })

  await t.test('Validates Robo Soccer team composition', () => {
    const soccer = { minTeamSize: 1, maxTeamSize: 3 }
    assert.equal(validateTeamRoster(soccer, 0).valid, false)
    assert.equal(validateTeamRoster(soccer, 4).valid, false)
    assert.equal(validateTeamRoster(soccer, 1).valid, true)
    assert.equal(validateTeamRoster(soccer, 3).valid, true)
  })

  await t.test('Validates Robo Race operator count', () => {
    const race = { minTeamSize: null, maxTeamSize: null, operatorCount: 1 }
    assert.equal(validateTeamRoster(race, 2, 1).valid, true)
    assert.equal(validateTeamRoster(race, 2, 2).valid, false)
  })
})

test('Submission Deadline & AI Disclosure Integrity', async (t) => {
  function validateSubmission(submission: {
    deadline: Date
    currentDate: Date
    usedAI: boolean
    aiToolsUsed?: string[]
    aiUsageDescription?: string
  }): { valid: boolean; error?: string } {
    if (submission.currentDate.getTime() > submission.deadline.getTime()) {
      return { valid: false, error: 'DEADLINE_EXPIRED: Submissions are locked' }
    }

    if (submission.usedAI) {
      if (!submission.aiToolsUsed || submission.aiToolsUsed.length === 0) {
        return { valid: false, error: 'AI_DISCLOSURE_INCOMPLETE: Disclosed AI requires specific tool listings' }
      }
      if (!submission.aiUsageDescription || submission.aiUsageDescription.trim().length < 10) {
        return { valid: false, error: 'AI_DISCLOSURE_INCOMPLETE: Disclosed AI requires detailed description' }
      }
    }

    return { valid: true }
  }

  await t.test('Rejects submissions after deadline', () => {
    const pastDeadline = new Date('2026-10-30T12:00:00Z')
    const submissionTime = new Date('2026-10-30T12:01:00Z')

    const result = validateSubmission({
      deadline: pastDeadline,
      currentDate: submissionTime,
      usedAI: false,
    })
    assert.equal(result.valid, false)
    assert.match(result.error || '', /DEADLINE_EXPIRED/)
  })

  await t.test('Enforces AI disclosure details when AI assistance is declared', () => {
    const deadline = new Date('2026-10-30T12:00:00Z')
    const submissionTime = new Date('2026-10-30T11:00:00Z')

    // AI declared with empty tool list
    const invalidAi = validateSubmission({
      deadline,
      currentDate: submissionTime,
      usedAI: true,
      aiToolsUsed: [],
      aiUsageDescription: '',
    })
    assert.equal(invalidAi.valid, false)

    // AI declared properly
    const validAi = validateSubmission({
      deadline,
      currentDate: submissionTime,
      usedAI: true,
      aiToolsUsed: ['GitHub Copilot', 'Claude 3.7 Sonnet'],
      aiUsageDescription: 'Used Copilot for scaffolding and Claude for test generation.',
    })
    assert.equal(validAi.valid, true)
  })
})

test('Payment Provider Security & Fail-Closed Guard', async (t) => {
  const originalEnv = process.env.NODE_ENV
  const originalProvider = process.env.PAYMENT_PROVIDER
  const env = process.env as Record<string, string | undefined>

  await t.test('Mock payment fails closed in production', async () => {
    env.NODE_ENV = 'production'
    env.PAYMENT_PROVIDER = 'mock'

    try {
      assert.throws(
        () => {
          getPaymentProvider()
        },
        /Production payment provider required|Mock payment provider is not allowed/
      )
    } finally {
      env.NODE_ENV = originalEnv
      env.PAYMENT_PROVIDER = originalProvider
    }
  })

  await t.test('Development environment permits mock provider', async () => {
    env.NODE_ENV = 'development'
    env.PAYMENT_PROVIDER = 'mock'

    try {
      const provider = getPaymentProvider()
      assert.equal(provider.name, 'mock')

      const order = await provider.createOrder({
        amount: 69900,
        currency: 'INR',
        receipt: 'test_receipt_1',
      })
      assert.ok(order.orderId.startsWith('mock_order_'))
      assert.equal(order.amount, 69900)
    } finally {
      env.NODE_ENV = originalEnv
      env.PAYMENT_PROVIDER = originalProvider
    }
  })
})

test('Evaluation Scoring Invariants', async (t) => {
  function calculateTotalScore(
    scores: { criteriaId: string; score: number }[],
    criteria: { id: string; maxScore: number }[]
  ): { valid: boolean; total: number; error?: string } {
    let total = 0
    for (const item of scores) {
      const rubric = criteria.find((c) => c.id === item.criteriaId)
      if (!rubric) {
        return { valid: false, total: 0, error: `Invalid criteria ID: ${item.criteriaId}` }
      }
      if (item.score < 0 || item.score > rubric.maxScore) {
        return { valid: false, total: 0, error: `Score ${item.score} out of bounds for max ${rubric.maxScore}` }
      }
      total += item.score
    }
    return { valid: true, total }
  }

  const rubrics = [
    { id: 'crit-1', maxScore: 20 },
    { id: 'crit-2', maxScore: 20 },
    { id: 'crit-3', maxScore: 20 },
  ]

  await t.test('Accepts valid bounded scores', () => {
    const result = calculateTotalScore(
      [
        { criteriaId: 'crit-1', score: 18 },
        { criteriaId: 'crit-2', score: 15 },
        { criteriaId: 'crit-3', score: 19 },
      ],
      rubrics
    )
    assert.equal(result.valid, true)
    assert.equal(result.total, 52)
  })

  await t.test('Rejects scores exceeding criteria maxScore', () => {
    const result = calculateTotalScore(
      [
        { criteriaId: 'crit-1', score: 25 }, // Exceeds 20
        { criteriaId: 'crit-2', score: 15 },
      ],
      rubrics
    )
    assert.equal(result.valid, false)
    assert.match(result.error || '', /out of bounds/)
  })
})

test('Logging Subsystem', async () => {
  assert.doesNotThrow(() => {
    logger.info('Test log entry from business logic test suite')
    logger.audit('USER_TEST', 'TEST_ACTION', 'Resource', 'res-1', { status: 'passed' })
  })
})
