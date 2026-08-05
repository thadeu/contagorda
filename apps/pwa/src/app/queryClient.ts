import { QueryClient } from '@tanstack/react-query'

/**
 * Cached data is served while a refetch happens in the background, so opening
 * the app shows last known figures instead of a spinner. On a phone that is the
 * difference between "instant" and "loading" — and in an installed PWA the app
 * is opened and dismissed constantly.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})
