import { createBrowserRouter } from 'react-router'
import { AppShell } from './layout/AppShell'
import { RequireAuth } from './auth/RequireAuth'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { AccountsPage } from '../features/accounts/AccountsPage'
import { InvitePage } from '../features/ledgers/InvitePage'

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
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'invite/:token', element: <InvitePage /> },
      // The Clowk callback lands here. Rendering the month view means the
      // provider finishes its exchange and the user sees the app, rather than a
      // dead URL they have to navigate away from themselves.
      { path: 'clowk/oauth/callback', element: <DashboardPage /> },
    ],
  },
])
