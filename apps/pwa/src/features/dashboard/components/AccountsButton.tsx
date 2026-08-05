import { useLocation, useNavigate } from 'react-router'
import { WalletIcon } from '../../../ui/icons'

/**
 * The way to accounts, next to the avatar.
 *
 * It carries the month across in the query string. Accounts shows balances for
 * a month, so arriving there without one would silently answer for today —
 * which is the wrong month exactly when someone was looking at another one.
 */
export function AccountsButton() {
  const navigate = useNavigate()
  const { search } = useLocation()

  return (
    <button
      type="button"
      onClick={() => navigate({ pathname: '/accounts', search })}
      aria-label="Contas"
      className="grid size-9 place-items-center rounded-full bg-white/70 text-ink"
    >
      <WalletIcon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
  )
}
