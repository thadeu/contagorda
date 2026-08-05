import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useMonth } from '../../app/useMonth'
import { useCreateTransaction } from './hooks'
import { useAccounts, useCategories } from '../accounts/hooks'
import { parseBRLToCents } from '../../lib/money'
import { todayIso } from '../../lib/dates'
import { Button } from '../../ui/Button'
import type { Direction } from '../../services/types'

/**
 * Fields for v1, and nothing else.
 *
 * Direction, amount, description, date, account, category, paid. Everything
 * else a finance app eventually grows — tags, attachments, splits, notes — is
 * absent on purpose: this is the form someone fills in a queue with one hand,
 * and every extra field is a reason to give up halfway.
 *
 * Direction comes first because it changes which categories make sense, and
 * asking for it up front avoids showing a list the answer will invalidate.
 */
export function NewTransactionPage() {
  const navigate = useNavigate()
  const { month } = useMonth()
  const create = useCreateTransaction(month)
  const accounts = useAccounts()
  const categories = useCategories()

  const [kind, setKind] = useState<Direction>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayIso())
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paid, setPaid] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const availableCategories = (categories.data ?? []).filter((c) => c.kind === kind)
  const resolvedAccount = accountId || accounts.data?.[0]?.id || ''

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const cents = parseBRLToCents(amount)

    if (cents === null || cents <= 0) {
      setError('Informe um valor maior que zero.')

      return
    }

    if (!description.trim()) {
      setError('Descreva o lançamento para reconhecê-lo depois.')

      return
    }

    create.mutate(
      {
        account_id: resolvedAccount,
        category_id: categoryId || null,
        kind,
        amount_cents: cents,
        date,
        description: description.trim(),
        paid,
      },
      { onSuccess: () => navigate('/') },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-8">
      <h1 className="font-display text-xl">Novo lançamento</h1>

      <div className="grid grid-cols-2 gap-2 pt-5" role="group" aria-label="Tipo">
        <DirectionButton active={kind === 'expense'} onClick={() => setKind('expense')} tone="out">
          Saiu
        </DirectionButton>
        <DirectionButton active={kind === 'income'} onClick={() => setKind('income')} tone="in">
          Entrou
        </DirectionButton>
      </div>

      <Field label="Valor">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg text-faint">R$</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            autoFocus
            className="tnum w-full bg-transparent font-mono text-3xl text-text outline-none placeholder:text-faint"
          />
        </div>
      </Field>

      <Field label="Descrição">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mercado, aluguel, salário…"
          className="w-full bg-transparent text-base text-text outline-none placeholder:text-faint"
        />
      </Field>

      <Field label="Data">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="tnum w-full bg-transparent font-mono text-base text-text outline-none"
        />
      </Field>

      <Field label="Conta">
        <select
          value={resolvedAccount}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full bg-transparent text-base text-text outline-none"
        >
          {(accounts.data ?? []).map((account) => (
            <option key={account.id} value={account.id} className="bg-raised">
              {account.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Categoria">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full bg-transparent text-base text-text outline-none"
        >
          <option value="" className="bg-raised">
            Sem categoria
          </option>
          {availableCategories.map((category) => (
            <option key={category.id} value={category.id} className="bg-raised">
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-center gap-3 border-b border-hairline py-4">
        <input
          type="checkbox"
          checked={paid}
          onChange={(e) => setPaid(e.target.checked)}
          className="size-5 accent-[var(--color-in)]"
        />
        <span className="text-sm text-text">
          {kind === 'expense' ? 'Já paguei' : 'Já recebi'}
        </span>
      </label>

      {error && (
        <p role="alert" className="pt-4 text-sm text-out">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-6">
        <Button type="submit" className="flex-1" disabled={create.isPending}>
          {create.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  children: React.ReactNode
}) {
  const activeClass = tone === 'in' ? 'border-in text-in bg-in-dim/15' : 'border-out text-out bg-out-dim/15'

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
