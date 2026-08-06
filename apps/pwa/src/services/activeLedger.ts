const KEY = 'contagorda.ledger'

let activeId: string | null = readStored()

/**
 * Which ledger the app is currently reading and writing.
 *
 * It is ambient rather than a parameter because that is what it will be over
 * HTTP: one header, set once on the client, present on every request. A screen
 * that had to pass a ledger id could pass the wrong one, and the day it did the
 * symptom would be someone's grocery bill appearing in another family's month.
 *
 * It survives a reload. Reopening the app on the ledger you were not looking at
 * is how money gets entered in the wrong place.
 */
export function getActiveLedgerId(): string | null {
  return activeId
}

export function setActiveLedgerId(id: string | null): void {
  activeId = id

  try {
    if (id === null) {
      localStorage.removeItem(KEY)
    } else {
      localStorage.setItem(KEY, id)
    }
  } catch {
    // Private mode and blocked storage: the choice still holds for this session.
  }
}

function readStored(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
