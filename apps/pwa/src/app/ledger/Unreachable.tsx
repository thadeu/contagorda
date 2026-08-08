import { EmptyState } from '@/ui/EmptyState'

/**
 * What the app shows when it cannot find out which ledger it is in.
 *
 * The whole app blocks on that answer, so a failure here has nowhere to fall
 * back to — but "nowhere to fall back to" is not the same as showing nothing.
 * A blank screen tells a person their app is broken and gives them no move; the
 * app was already down before, this only makes it say so.
 *
 * It says the connection rather than the ledger, because that is what the
 * person can act on. The list of ledgers is not a thing they know they have.
 */
export function Unreachable({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div className="flex h-full items-center justify-center bg-appshell">
      <EmptyState
        title="Sem conexão com o servidor"
        hint="Não conseguimos carregar seus dados. Verifique sua internet e tente de novo."
        action={
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="min-h-11 rounded-full bg-fill px-6 text-[0.9375rem] font-semibold text-on-fill disabled:opacity-60"
          >
            {retrying ? 'Tentando…' : 'Tentar de novo'}
          </button>
        }
      />
    </div>
  )
}
