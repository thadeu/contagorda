import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockServices } from './index'
import { monthKey, shiftMonth, todayIso } from '@/lib/dates'

/**
 * The fixtures hold a transaction in every month of two years, so the source
 * here is a month that certainly has rows, and the target is one well past them.
 */
const thisMonth = monthKey(todayIso())
const source = shiftMonth(thisMonth, -1)

describe('copying a month', () => {
  const services = createMockServices()

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /**
   * Every call answers after a delay, and the clock is fake: a promise awaited
   * as it stands never settles. This lets the latency pass first.
   */
  async function ready<T>(pending: Promise<T>): Promise<T> {
    const outcome = pending.then(
      (value) => ({ value }),
      (error: unknown) => ({ error }),
    )

    await vi.advanceTimersByTimeAsync(200)

    const result = await outcome

    if ('error' in result) throw result.error

    return result.value
  }

  async function settle(ms = 20_000) {
    await vi.advanceTimersByTimeAsync(ms)
  }

  it('answers at once and fills the target over time', async () => {
    const target = shiftMonth(thisMonth, 40)
    const clone = await start(source, target)

    expect(clone).toMatchObject({ source_month: source, target_month: target, status: 'pending' })
    expect(await ready(services.transactions.listByMonth(target))).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(500)

    const midway = await ready(services.monthClones.get(clone.id))

    expect(midway.status).toBe('running')
    expect(midway.copied).toBeGreaterThan(0)
    expect(midway.copied).toBeLessThan(midway.total)

    await settle()

    const finished = await ready(services.monthClones.get(clone.id))
    const rows = await ready(services.transactions.listByMonth(target))

    expect(finished.status).toBe('done')
    expect(finished.copied).toBe(finished.total)
    expect(rows).toHaveLength(finished.total)
  })

  it('copies on the same day, never paid, and never into a series', async () => {
    const target = shiftMonth(thisMonth, 41)
    const original = await ready(services.transactions.listByMonth(source))

    await start(source, target)
    await settle()

    const copies = await ready(services.transactions.listByMonth(target))
    const days = original.map((t) => t.date.slice(8))

    expect(copies.map((t) => t.date.slice(8)).sort()).toEqual(days.sort())
    expect(copies.every((t) => t.paid_at === null)).toBe(true)
    expect(copies.every((t) => t.recurring_series_id === null)).toBe(true)
  })

  // The target is past the end of every series, so nothing covers it.
  it('copies a recurring row when its series wrote nothing into the target', async () => {
    const target = shiftMonth(thisMonth, 42)
    const original = await ready(services.transactions.listByMonth(source))
    const recurring = original.filter((t) => t.recurring_series_id !== null)

    expect(recurring.length).toBeGreaterThan(0)

    const clone = await start(source, target)

    await settle()

    const finished = await ready(services.monthClones.get(clone.id))

    expect(finished.total).toBe(original.length)
    expect(finished.skipped).toBe(0)
  })

  // The fixtures write a series into every month, so this month is covered.
  it('leaves out a recurring row when its series already wrote into the target', async () => {
    const original = await ready(services.transactions.listByMonth(source))
    const before = await ready(services.transactions.listByMonth(thisMonth))
    const plain = original.filter((t) => t.recurring_series_id === null)
    const recurring = original.length - plain.length

    const clone = await start(source, thisMonth)

    await settle()

    const finished = await ready(services.monthClones.get(clone.id))
    const after = await ready(services.transactions.listByMonth(thisMonth))

    expect(finished.skipped).toBe(recurring)
    expect(finished.total).toBe(plain.length)
    expect(after).toHaveLength(before.length + plain.length)
  })

  it('refuses a month with nothing in it', async () => {
    await expect(start(shiftMonth(thisMonth, 60), thisMonth)).rejects.toThrow(/não tem lançamentos/)
  })

  it('refuses a second copy into a month that is still filling', async () => {
    const target = shiftMonth(thisMonth, 43)

    await start(source, target)

    await expect(start(source, target)).rejects.toThrow(/Já estamos copiando/)
  })

  it('writes only what is missing when the same month is copied again', async () => {
    const target = shiftMonth(thisMonth, 44)

    await start(source, target)
    await settle()

    const first = await ready(services.transactions.listByMonth(target))
    const again = await start(source, target)

    await settle()

    expect(await ready(services.transactions.listByMonth(target))).toHaveLength(first.length)
    expect(await ready(services.monthClones.get(again.id))).toMatchObject({ status: 'done' })
  })

  function start(from: string, to: string) {
    return ready(services.monthClones.start(from, to))
  }
})
