import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ClowkProvider } from '@clowk/react'
import './styles/tokens.css'
import { router } from '@/app/router'
import { queryClient } from '@/app/queryClient'
import { PUBLISHABLE_KEY, configureClowk } from '@/clowk'
import { TokenBridge } from '@/app/auth/TokenBridge'
import { forgetMonthOnColdStart } from '@/app/coldStart'
import { applyStoredTheme } from '@/app/theme'

configureClowk()
forgetMonthOnColdStart()
applyStoredTheme()

// afterSignOutPath is empty on purpose: with a path set, the SDK navigates away
// on sign-out while the auth guard is already redirecting to Clowk, and the two
// race each other. The guard owns where a signed-out user goes.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClowkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutPath="">
      <TokenBridge>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </TokenBridge>
    </ClowkProvider>
  </StrictMode>,
)
