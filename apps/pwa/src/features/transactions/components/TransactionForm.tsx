import { useState, type FormEvent, type ReactNode } from 'react'
import { useAccounts, useCategories } from '../../accounts/hooks'
import { parseBRLToCents } from '../../../lib/money'
import { Button } from '../../../ui/Button'
import { CategoryPicker } from './CategoryPicker'
import { emptyValues, type TransactionFormValues } from '../formValues'
import type { NewTransaction } from '../../../services/types'

interface TransactionFormProps {
  initial?: Partial<TransactionFormValues>
  submitLabel: string
  pending: boolean
  /** `customCategory` is set when the user typed one under "Outros". */
  onSubmit: (input: NewTransaction, customCategory: string | null) => void
  onCancel: () => void
  /** Destructive actions live at the bottom, away from the primary path. */
  footer?: ReactNode
}

/**
 * One form for creating and editing.
 *
 * Editing is not a rare path — an estimated bill gets corrected once the real
 * amount arrives — so it uses the same screen rather than a reduced one that
 * drifts from it.
 */
export function TransactionForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
  footer,
}: TransactionFormProps) {
  const accounts = useAccounts()
  const categories = useCategories()

  const base = { ...emptyValues(), ...initial }
  const [values, setValues] = useState<TransactionFormValues>(base)
  const [error, setError] = useState<string | null>(null)

  const resolvedAccount = values.accountId || accounts.data?.[0]?.id || ''

  function set<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const cents = parseBRLToCents(values.amount)

    if (cents === null || cents <= 0) {
      setError('Informe um valor maior que zero.')

      return
    }

    if (!values.description.trim()) {
      setError('Descreva o lançamento para reconhecê-lo depois.')

      return
    }

    const custom = values.customCategory.trim()

    onSubmit(
      {
        account_id: resolvedAccount,
        category_id: values.categoryId || null,
        kind: values.kind,
        amount_cents: cents,
        date: values.date,
        description: values.description.trim(),
        paid: values.paid,
      },
      custom === '' ? null : custom,
    )
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-8">
      <div className="grid grid-cols-2 gap-2 pt-5" role="group" aria-label="Tipo">
        <DirectionButton
          active={values.kind === 'expense'}
          onClick={() => set('kind', 'expense')}
          tone="out"
        >
          Saiu
        </DirectionButton>
        <DirectionButton
          active={values.kind === 'income'}
          onClick={() => set('kind', 'income')}
          tone="in"
        >
          Entrou
        </DirectionButton>
      </div>

      <Field label="Valor">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg text-faint">R$</span>
          <input
            value={values.amount}
            onChange={(e) => set('amount', e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            autoFocus
            className="tnum w-full bg-transparent font-mono text-3xl text-text outline-none placeholder:text-faint"
          />
        </div>
      </Field>

      <Field label="Descrição">
        <input
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Mercado, aluguel, salário…"
          className="w-full bg-transparent text-base text-text outline-none placeholder:text-faint"
        />
      </Field>

      <Field label="Data">
        <input
          type="date"
          value={values.date}
          onChange={(e) => set('date', e.target.value)}
          className="tnum w-full bg-transparent font-mono text-base text-text outline-none"
        />
      </Field>

      <Field label="Conta">
        <select
          value={resolvedAccount}
          onChange={(e) => set('accountId', e.target.value)}
          className="w-full bg-transparent text-base text-text outline-none"
        >
          {(accounts.data ?? []).map((account) => (
            <option key={account.id} value={account.id} className="bg-raised">
              {account.name}
            </option>
          ))}
        </select>
      </Field>

      <CategoryPicker
        categories={categories.data ?? []}
        kind={values.kind}
        value={values.categoryId}
        onChange={(id) => set('categoryId', id)}
        customName={values.customCategory}
        onCustomNameChange={(name) => set('customCategory', name)}
      />

      <label className="flex items-center gap-3 border-b border-hairline py-4">
        <input
          type="checkbox"
          checked={values.paid}
          onChange={(e) => set('paid', e.target.checked)}
          className="size-5 accent-[var(--color-in)]"
        />
        <span className="text-sm text-text">
          {values.kind === 'expense' ? 'Já paguei' : 'Já recebi'}
        </span>
      </label>

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

function DirectionButton({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean
  onClick: () => void
  tone: 'in' | 'out'
  children: ReactNode
}) {
  const activeClass =
    tone === 'in' ? 'border-in text-in bg-in-dim/15' : 'border-out text-out bg-out-dim/15'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-12 rounded-xl border text-sm font-medium transition-colors ${
        active ? activeClass : 'border-hairline text-muted'
      }`}
    >
      {children}
    </button>
  )
}
