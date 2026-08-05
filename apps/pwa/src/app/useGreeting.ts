import { useAuth } from '@clowk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '../services'

export const profileKey = ['profile'] as const

/**
 * The name this app calls you by.
 *
 * Clowk answers who you are; what you want to be called on this screen is the
 * app's own business, and it is not something an auth broker should be asked to
 * store. A chosen name wins when there is one, and the identity provider's name
 * stands when there is not — so the greeting keeps working before anyone has
 * opened the profile, and keeps up if the name changes at the provider.
 */
export function useProfile() {
  return useQuery({ queryKey: profileKey, queryFn: () => services.profile.get() })
}

export function useUpdateProfile() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (displayName: string) => services.profile.update({ display_name: displayName }),
    onSuccess: () => client.invalidateQueries({ queryKey: profileKey }),
  })
}

/**
 * Greets by first name only. A full name in a headline reads as a form field
 * being echoed back; the first name reads as the app knowing who you are.
 */
export function useGreeting() {
  const { user } = useAuth()
  const profile = useProfile()

  const fromProvider = typeof user?.name === 'string' ? user.name : ''
  const name = profile.data?.display_name ?? fromProvider
  const firstName = name.trim().split(' ')[0] ?? ''
  const avatarUrl = typeof user?.avatar_url === 'string' ? user.avatar_url : null
  const email = typeof user?.email === 'string' ? user.email : ''

  return { salutation: salutationFor(new Date().getHours()), name, firstName, avatarUrl, email }
}

function salutationFor(hour: number): string {
  if (hour < 12) return 'Bom dia'

  if (hour < 18) return 'Boa tarde'

  return 'Boa noite'
}
