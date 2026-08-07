import { Outlet } from 'react-router'
import { ActiveLedgerProvider } from '@/app/ledger/ActiveLedgerProvider'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { AccountEditorProvider } from '@/features/accounts/AccountEditor'
import { TransactionEditorProvider } from '@/features/transactions/TransactionEditor'

/**
 * The frame is in normal flow, filling `#root`, and nothing here is `fixed`.
 *
 * On iOS a `position: fixed` box gets inset by the safe areas in the installed
 * app, so a frame pinned to all four sides came up smaller than the screen with
 * the page showing around it — which is the band, and why it never appeared in
 * the browser. A flow box filling a `height: 100%` chain has no such surprise.
 *
 * `main` adds no padding of its own. A screen that fills the height — the stats
 * view, whose panel is meant to reach the bottom edge — cannot have the frame
 * reserving a strip underneath it, and the screens that do want breathing room
 * at the end know better than the shell how much.
 *
 * The app scrolls inside `main`, not the document. On iOS the scroll indicator
 * for the root scroller is drawn by the system and CSS cannot touch it; on any
 * other scroller `::-webkit-scrollbar` applies. It also makes freezing the page
 * behind a sheet a matter of one `overflow` property instead of pinning the
 * body and restoring its offset afterwards.
 *
 * There is no tab bar. It ended up holding one tab that led where you already
 * were and one action, having lost accounts to the header and forms to modals —
 * a floating button-holder that covered the last row of the list, which is why
 * it had to learn to hide on scroll.
 *
 * Adding a transaction now sits beside the filter it adds to, and accounts is
 * reached from the header. Each screen offers what belongs to it, and nothing
 * floats over the content to do it.
 */
export function AppShell() {
  return (
    <ActiveLedgerProvider>
      <TransactionEditorProvider>
        <AccountEditorProvider>
          <Shell />
        </AccountEditorProvider>
      </TransactionEditorProvider>
    </ActiveLedgerProvider>
  )
}

function Shell() {
  return (
    <div className="app-surface relative mx-auto flex h-full max-w-lg flex-col overflow-hidden bg-canvas">
      <main className="app-scroll flex-1 overflow-y-auto overscroll-contain">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
