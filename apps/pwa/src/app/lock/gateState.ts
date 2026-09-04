/**
 * Whether this launch has already been through the biometric gate.
 *
 * Its own module so the gate component exports only a component, and so a
 * test can reset it between cases.
 */
export const gateState = { unlocked: false }
