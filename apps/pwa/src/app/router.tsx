import { createBrowserRouter } from 'react-router'
import { AppShell } from './layout/AppShell'
import { RequireAuth } from './auth/RequireAuth'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { InvitePage } from '@/features/ledgers/InvitePage'
import { StatsPage } from '@/features/stats/StatsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      // The month view is the transaction list; there is no separate screen for
      // it. Having both meant two routes rendering the same thing.
      { index: true, element: <DashboardPage /> },
      // Accounts is a sheet over the month, not a route. It is something you
      // glance at and come back from, and a route would put it in the address
      // bar and hand you a back button to find your own way home.
      { path: 'stats', element: <StatsPage /> },
      { path: 'invite/:token', element: <InvitePage /> },
      // The Clowk callback lands here. Rendering the month view means the
      // provider finishes its exchange and the user sees the app, rather than a
      // dead URL they have to navigate away from themselves.
      { path: 'clowk/oauth/callback', element: <DashboardPage /> },
    ],
  },
])
