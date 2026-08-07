import { useState, type FormEvent, type ReactNode } from 'react'
import { ACCOUNT_KINDS } from '../accountKinds'
import { parseBRLToCents } from '../../../lib/money'
import { Button } from '../../../ui/Button'
import type { AccountKind } from '../../../services/types'
import type { NewAccount } from '../../../services/ports'

// The balance asked for is what the account holds at the start of the selected
// month, not its current total: the rest of the month is derived from the
// transactions in it. That also means an account can be added mid-life without
// entering everything that came before it.
interface AccountFormProps {
  initial?: Partial<{ name: string; kind: AccountKind; institution: string; balance: string }>
  submitLabel: string
  pending: boolean
  /** Named after the month, because the number belongs to one. */
  balanceLabel: string
  onSubmit: (input: NewAccount, openingCents: number) => void
  footer?: ReactNode
}

export function AccountForm({
  initial,
  submitLabel,
  pending,
  balanceLabel,
  onSubmit,
  footer,
}: AccountFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<AccountKind>(initial?.kind ?? 'checking')
  const [institution, setInstitution] = useState(initial?.institution ?? '')
  const [balance, setBalance] = useState(initial?.balance ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // React events travel the component tree, so a form inside another form's
    // tree — which a portal does not change — submits both. See CategoryFormSheet.
    event.stopPropagation()

    if (!name.trim()) {
      setError('Dê um nome para reconhecer a conta na lista.')

      return
    }

    onSubmit(
      {
        name: name.trim(),
        kind,
        institution: institution.trim() || null,
      },
      parseBRLToCents(balance) ?? 0,
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 px-4 pt-4">
      <Field label="Nome">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nubank, Carteira…"
          className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
        />
      </Field>

      <Field label="Tipo">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as AccountKind)}
          className="w-full bg-transparent text-base text-ink outline-none"
        >
          {ACCOUNT_KINDS.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface">
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Instituição">
        <input
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder="Opcional"
          className="w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
        />
      </Field>

      <Field label={balanceLabel}>
        <div className="flex items-baseline gap-2">
          <span className="text-base text-faint">R$</span>
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            className="tnum w-full bg-transparent text-base text-ink outline-none placeholder:text-faint"
          />
        </div>
      </Field>

      {error && (
        <p role="alert" className="pt-4 text-sm text-out">
          {error}
        </p>
      )}

      <Button type="submit" className="mt-1 w-full" disabled={pending}>
        {pending ? 'Salvando…' : submitLabel}
      </Button>

      {footer}
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="card-shadow block rounded-control bg-surface px-4 py-3">
      <span className="block pb-0.5 text-xs text-muted">{label}</span>
      {children}
    </label>
  )
}
