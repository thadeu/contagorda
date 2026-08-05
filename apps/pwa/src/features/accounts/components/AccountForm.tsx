import { useState, type FormEvent, type ReactNode } from 'react'
import { ACCOUNT_KINDS } from '../accountKinds'
import { parseBRLToCents } from '../../../lib/money'
import { Button } from '../../../ui/Button'
import type { AccountKind } from '../../../services/types'
import type { NewAccount } from '../../../services/ports'

// The balance asked for is the starting one, not the current one: the balance is
// derived from transactions, so an account can be added mid-life without
// entering everything that came before it.
interface AccountFormProps {
  initial?: Partial<{ name: string; kind: AccountKind; institution: string; balance: string }>
  submitLabel: string
  pending: boolean
  onSubmit: (input: NewAccount) => void
  onCancel: () => void
  footer?: ReactNode
}

export function AccountForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
  footer,
}: AccountFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<AccountKind>(initial?.kind ?? 'checking')
  const [institution, setInstitution] = useState(initial?.institution ?? '')
  const [balance, setBalance] = useState(initial?.balance ?? '')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!name.trim()) {
      setError('Dê um nome para reconhecer a conta na lista.')

      return
    }

    onSubmit({
      name: name.trim(),
      kind,
      institution: institution.trim() || null,
      initial_balance_cents: parseBRLToCents(balance) ?? 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-8">
      <Field label="Nome">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nubank, Carteira…"
          autoFocus
          className="w-full bg-transparent text-base text-text outline-none placeholder:text-faint"
        />
      </Field>

      <Field label="Tipo">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as AccountKind)}
          className="w-full bg-transparent text-base text-text outline-none"
        >
          {ACCOUNT_KINDS.map((option) => (
            <option key={option.value} value={option.value} className="bg-raised">
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
          className="w-full bg-transparent text-base text-text outline-none placeholder:text-faint"
        />
      </Field>

      <Field label="Saldo inicial">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-base text-faint">R$</span>
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            className="tnum w-full bg-transparent font-mono text-base text-text outline-none placeholder:text-faint"
          />
        </div>
      </Field>

      {error && (
        <p role="alert" className="pt-4 text-sm text-out">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-6">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? 'Salvando…' : submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {footer}
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block border-b border-hairline py-4">
      <span className="block pb-1.5 text-xs tracking-wide text-faint uppercase">{label}</span>
      {children}
    </label>
  )
}
