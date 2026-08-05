import type { Services } from './ports'
import { createMockServices } from './mock'

/**
 * The one place that decides where data comes from.
 *
 * Today it is always the mock. When the API is ready this becomes a choice
 * between two implementations of the same interfaces, and nothing above it
 * changes — which is the point of building the screens first.
 */
export const services: Services = createMockServices()

export type { Services } from './ports'
export * from './types'
