import { useState, type FormEvent, type ReactNode } from 'react'
import { useAccounts, useCategories } from '@/features/accounts/hooks'
import { parseBRLToCents } from '@/lib/money'
import { CategoryPicker } from './CategoryPicker'
import { AccountPicker } from './AccountPicker'
import { AmountField } from './AmountField'
import { Switch } from '@/ui/Switch'
import { OutflowIcon, PiggyIcon } from '@/ui/icons'
import { useMemberName } from '@/features/ledgers/useMemberName'
import { RecurrencePicker } from './RecurrencePicker'
import type { Recurrence } from '@/features/transactions/recurrence'
import { emptyValues, type TransactionFormValues } from '@/features/transactions/formValues'
import type { Direction } from '@/services/types'
import type { NewTransaction } from '@/services/types'
import { useNameSuggestions } from '@/features/transactions/useNameSuggestions'
import type { NameSuggestion } from '@/features/transactions/suggestions'

interface TransactionFormProps {
  /** Ties the form to a submit button that lives outside it, in the nav bar. */
  id: string
  /** Who entered it, when editing one that exists. Shown, never edited. */
  authorId?: string | null
  /**
   * Absent when editing. A series is decided once, at the moment it is created:
   * changing the rule afterwards would mean rewriting rows that already exist,
   * some of them already paid, and the scope choice on save is the honest way to
   * reach those.
   */
  recurrence?: Recurrence | null
  onRecurrenceChange?: (recurrence: Recurrence | null) => void
  initial?: Partial<TransactionFormValues>
  /**
   * Reported upward so the panel's own title can say which of the two this is.
   * The direction is the first thing decided and the last thing anyone would
   * think to check twice, and the heading is where a screen says what it is.
   */
  onKindChange?: (kind: Direction) => void
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
  recurrence,
  onRecurrenceChange,
  initial,
  onKindChange,
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

  const [naming, setNaming] = useState(false)
  const suggestions = useNameSuggestions(naming ? values.description : '', values.kind)

  /**
   * A name brings its company. The category and the account it was last filed
   * under are filled in with it, since the same market is paid from the same
   * card nearly every time — and both stay editable below, for the time it is
   * not.
   *
   * The chips prevent `mousedown` so the field keeps focus through the tap:
   * blurring first would take them away before the click could land on one.
   */
  function pick(suggestion: NameSuggestion) {
    setValues((current) => ({
      ...current,
      description: suggestion.description,
      categoryId: suggestion.categoryId ?? '',
      accountId: suggestion.accountId,
    }))
    setNaming(false)
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
      <AmountField value={values.amount} onChange={(amount) => set('amount', amount)} />

      <div className="divide-y divide-line rounded-card bg-surface px-4">
        {/* It moved into the block with the rest of what is being entered. Two
            full-width buttons above the card made the direction look like a mode
            the form was in — a screen for expenses and another for income — when
            it is one field among six. As a row it is the same size as the
            account and the date, which is the size it is. */}
        <Row label="Tipo">
          <DirectionSwitch
            kind={values.kind}
            onChange={(kind) => {
              set('kind', kind)
              onKindChange?.(kind)
            }}
          />
        </Row>

        <Row label="Descrição">
          <input
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            onFocus={() => setNaming(true)}
            onBlur={() => setNaming(false)}
            placeholder="Mercado, aluguel, salário…"
            autoComplete="off"
            autoCorrect="off"
            className="w-full bg-transparent text-right text-base text-ink outline-none placeholder:text-faint"
          />
        </Row>

        {suggestions.length > 0 && (
          <ul className="flex gap-2 overflow-x-auto py-2.5" aria-label="Nomes já usados">
            {suggestions.map((suggestion) => (
              <li key={suggestion.description} className="shrink-0">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(suggestion)}
                  className="rounded-full bg-sunken px-3 py-1.5 text-sm font-medium text-ink"
                >
                  {suggestion.description}
                </button>
              </li>
            ))}
          </ul>
        )}

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

        {onRecurrenceChange && (
          <RecurrencePicker
            date={values.date}
            value={recurrence ?? null}
            onChange={onRecurrenceChange}
          />
        )}
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

/**
 * Two icons, one lit.
 *
 * Words became pictures because the words were the widest thing in the row and
 * said the least: somebody entering a bill knows which of the two they are
 * doing, and needs to see it confirmed rather than read it. The pig is savings
 * arriving and the note with an arrow is money leaving, which are the two
 * pictures anyone already has for this.
 *
 * The colour is the confirmation. Only the chosen side carries `in` or `out`,
 * and both would be a form shouting in two directions at once — so the other one
 * goes quiet and the choice is the only thing coloured.
 *
 * It is `w-fit` and pushed right. The row hands its value slot the whole
 * remaining width, which is what every other row wants — a value right-aligned
 * against the edge. A control dropped into that slot stretches instead, and a
 * two-icon switch as wide as the card is a segmented control with a hole in the
 * middle of it.
 *
 * Expense sits first because nearly every entry is one. Order in a control this
 * small is not a detail: the left segment is the thumb's default and the first
 * thing read.
 */
function DirectionSwitch({
  kind,
  onChange,
}: {
  kind: Direction
  onChange: (kind: Direction) => void
}) {
  return (
    <div
      className="ml-auto flex w-fit gap-1 rounded-2xl bg-sunken p-1"
      role="group"
      aria-label="Tipo"
    >
      <Side
        active={kind === 'expense'}
        onClick={() => onChange('expense')}
        icon={<OutflowIcon className="size-4" />}
        label="Despesa"
        activeClass="bg-out text-white"
      />

      <Side
        active={kind === 'income'}
        onClick={() => onChange('income')}
        icon={<PiggyIcon className="size-4" />}
        label="Receita"
        activeClass="bg-in text-white"
      />
    </div>
  )
}

function Side({
  active,
  onClick,
  icon,
  label,
  activeClass,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  activeClass: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`grid size-9 place-items-center rounded-xl ${active ? activeClass : 'text-faint'}`}
    >
      {icon}
    </button>
  )
}
