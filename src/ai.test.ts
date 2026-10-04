import { describe, expect, it } from 'vitest'
import { instant, makeCards } from './lib/ai'

describe('instant', () => {
  it('leads with what the question asks', () => {
    const out = instant('Solve for x: 2x^2 - 5x - 3 = 0. Show all steps.')
    expect(out).toMatch(/^What it asks:/)
    expect(out).toContain('Solve for x')
  })

  it('always includes an attack plan', () => {
    expect(instant('Find the resistance.')).toContain('Attack plan')
  })

  it('handles empty input without crashing', () => {
    expect(() => instant('')).not.toThrow()
  })
})

describe('makeCards', () => {
  it('builds Q/A cards from an explanation', () => {
    const cards = makeCards(
      'Solve for x: 2x^2 - 5x - 3 = 0.',
      'What it asks:\n1. Solve for x: 2x^2 - 5x - 3 = 0.\n\nFactorise into (2x + 1)(x - 3) = 0 to find the roots.\n\nCheck by substituting both values back into the equation.',
    )
    expect(cards.length).toBeGreaterThan(0)
    for (const c of cards) {
      expect(c.front.length).toBeGreaterThan(0)
      expect(c.back.length).toBeGreaterThan(0)
    }
  })

  it('falls back to a restatement card when there is nothing to split', () => {
    const cards = makeCards('Why is the sky blue?', 'ok')
    expect(cards).toHaveLength(1)
    expect(cards[0].front).toMatch(/Restate/)
  })
})
