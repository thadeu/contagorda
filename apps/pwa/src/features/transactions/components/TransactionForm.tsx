import { useState, type FormEvent, type ReactNode } from 'react'
import { useAccounts, useCategories } from '../../accounts/hooks'
import { parseBRLToCents } from '../../../lib/money'
import { CategoryPicker } from './CategoryPicker'
import { AccountPicker } from './AccountPicker'
import { Switch } from '../../../ui/Switch'
import { useMemberName } from '../../ledgers/useMemberName'
import { emptyValues, type TransactionFormValues } from '../formValues'
import type { NewTransaction } from '../../../services/types'


interface TransactionFormProps {
  /** Ties the form to a submit button that lives outside it, in the nav bar. */
  id: string
  /** Who entered it, when editing one that exists. Shown, never edited. */
  authorId?: string | null
  initial?: Partial<TransactionFormValues>
  /** `customCategory` is set when the user typed one under "Outros". */
  onSubmit: (input: NewTransaction) => void
}

/**
 * One form for creating and editing.
 *
 * Editing is not a rare path — an estimated bill gets corrected once the real
 * amount arrives — so it uses the same screen rather than a reduced one that
 * drifts from it.
 *
 * Saving lives in the nav bar, opposite the close button — the shape the
 * platform uses for a task you either commit or abandon. A full-width button
 * under a divider is a web page's footer, and it took a strip of the panel from
 * the fields for an action that is one tap either way.
 *
 * There is no cancel: closing already means that, and a second control saying so
 * would sit beside the one action that matters.
 *
 * The amount is the reason the form was opened, so it is the one thing that
 * looks like it. Everything below it is a grouped list, the shape the rest of
 * the app uses — six boxes of equal weight meant scanning all six to find the
 * one field that needed changing, and the two that rarely do took as much room
 * as the two that always do.
 */
export function TransactionForm({
  id,
  authorId = null,
  initial,
  onSubmit,
}: TransactionFormProps) {
  const accounts = useAccounts()
  const categories = useCategories()
  const author = useMemberName(authorId)

  const base = { ...emptyValues(), ...initial }
  const [values, setValues] = useState<TransactionFormValues>(base)
  const [error, setError] = useState<string | null>(null)

  const resolvedAccount = values.accountId || accounts.data?.[0]?.id || ''

  function set<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    event.stopPropagation()

    const cents = parseBRLToCents(values.amount)

    if (cents === null || cents <= 0) {
      setError('Informe um valor maior que zero.')

      return
    }

    if (!values.description.trim()) {
      setError('Descreva o lançamento para reconhecê-lo depois.')

      return
    }

    onSubmit({
      account_id: resolvedAccount,
      category_id: values.categoryId || null,
      kind: values.kind,
      amount_cents: cents,
      date: values.date,
      description: values.description.trim(),
      paid: values.paid,
    })
  }

  return (
    <form id={id} onSubmit={handleSubmit} className="grid gap-4 px-4 pt-2 pb-6">
      <div className="flex items-baseline justify-center gap-2 pt-1">
        <span className="text-xl font-medium text-faint">R$</span>
        <input
          value={values.amount}
          onChange={(e) => set('amount', e.target.value)}
          inputMode="decimal"
          placeholder="0,00"
          aria-label="Valor"
          size={7}
          className="tnum min-w-0 bg-transparent text-center text-[2.5rem] leading-none font-bold tracking-[-0.02em] text-ink outline-none placeholder:text-faint"
        />
      </div>

      <div
        className="grid grid-cols-2 gap-1 rounded-2xl bg-sunken p-1"
        role="group"
        aria-label="Tipo"
      >
        <DirectionButton
          active={values.kind === 'expense'}
          onClick={() => set('kind', 'expense')}
          tone="out"
        >
          Despesa
        </DirectionButton>
        <DirectionButton
          active={values.kind === 'income'}
          onClick={() => set('kind', 'income')}
          tone="in"
        >
          Receita
        </DirectionButton>
      </div>

      <div className="divide-y divide-line rounded-card bg-surface px-4">
        <Row label="Descrição">
          <input
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Mercado, aluguel, salário…"
            className="w-full bg-transparent text-right text-base text-ink outline-none placeholder:text-faint"
          />
        </Row>

        <Row label="Data">
          <input
            type="date"
            value={values.date}
            onChange={(e) => set('date', e.target.value)}
            className="tnum w-full bg-transparent text-right text-base text-ink outline-none"
          />
        </Row>

        <AccountPicker
          accounts={accounts.data ?? []}
          value={resolvedAccount}
          onChange={(id) => set('accountId', id)}
        />
      </div>

      <div className="divide-y divide-line rounded-card bg-surface px-4">
        <CategoryPicker
          categories={categories.data ?? []}
          kind={values.kind}
          value={values.categoryId}
          onChange={(id) => set('categoryId', id)}
        />

        {/* A fact about the row, not a field: who entered it is decided when it
            is created and by whom, and an editable author would be a way to
            claim someone else's typing. */}
        {author && (
          <div className="flex min-h-13 items-center justify-between gap-3">
            <span className="text-sm text-muted">Lançado por</span>
            <span className="min-w-0 truncate text-base text-muted">{author}</span>
          </div>
        )}

        <div className="flex min-h-13 items-center justify-between gap-3">
          <span className="text-sm text-muted">
            {values.kind === 'expense' ? 'Já paguei' : 'Já recebi'}
          </span>

          <Switch
            checked={values.paid}
            onChange={(next) => set('paid', next)}
            label={values.kind === 'expense' ? 'Já paguei' : 'Já recebi'}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="pt-4 text-sm text-out">
          {error}
        </p>
      )}

    </form>
  )
}

/**
 * A labelled row, the shape the rest of the app already uses for lists.
 *
 * The label holds its own column and the value sits against the right edge, so
 * the four of them line up and the eye runs down one column instead of hunting
 * through six identical cards. It replaces a stack of separate boxes that gave
 * every field the same weight — including the two nobody changes.
 */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-h-13 items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-muted">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
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
  const activeClass = tone === 'in' ? 'bg-in text-white' : 'bg-out text-white'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-xl text-sm font-semibold ${
        active ? activeClass : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}
