import type { Services } from '@/services/ports'
import { createMockServices } from '@/services/mock'
import { createApiServices } from '@/services/api'

/**
 * The one place that decides where data comes from.
 *
 * `VITE_USE_MOCK=true` keeps the fixtures. It is off by default — the app talks
 * to the API unless somebody says otherwise — but the mock stays in the repo
 * rather than being deleted: it is what lets a screen be built, and the UI tests
 * be run, without a database anywhere near them.
 *
 * A string comparison and not a truthy check, because every Vite env value is a
 * string and `"false"` is truthy.
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const services: Services = USE_MOCK ? createMockServices() : createApiServices()

export type { Services } from '@/services/ports'
export * from '@/services/types'
