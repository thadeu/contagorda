import { useAuth } from '@clowk/react'

/**
 * Greets by first name only. A full name in a headline reads as a form field
 * being echoed back; the first name reads as the app knowing who you are.
 */
export function useGreeting() {
  const { user } = useAuth()
  const full = typeof user?.name === 'string' ? user.name : ''
  const firstName = full.trim().split(' ')[0] ?? ''

  return { salutation: salutationFor(new Date().getHours()), firstName }
}

function salutationFor(hour: number): string {
  if (hour < 12) return 'Bom dia'

  if (hour < 18) return 'Boa tarde'

  return 'Boa noite'
}
