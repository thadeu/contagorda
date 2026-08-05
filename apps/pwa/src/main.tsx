import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ClowkProvider } from '@clowk/react'
import './styles/tokens.css'
import { router } from './app/router'
import { queryClient } from './app/queryClient'
import { PUBLISHABLE_KEY, configureClowk } from './clowk'

configureClowk()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClowkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ClowkProvider>
  </StrictMode>,
)
