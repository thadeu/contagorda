import { createBrowserRouter } from 'react-router'
import { AppShell } from './layout/AppShell'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { TransactionsPage } from '../features/transactions/TransactionsPage'
import { NewTransactionPage } from '../features/transactions/NewTransactionPage'
import { AccountsPage } from '../features/accounts/AccountsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'transacoes', element: <TransactionsPage /> },
      { path: 'transacoes/novo', element: <NewTransactionPage /> },
      { path: 'contas', element: <AccountsPage /> },
      // The Clowk callback lands here. Rendering the dashboard means the
      // provider finishes its exchange and the user sees the app, rather than
      // a dead URL they have to navigate away from themselves.
      { path: 'clowk/oauth/callback', element: <DashboardPage /> },
    ],
  },
])
