import { useEffect, useState } from 'react'
import type { Transaction } from '@/services/types'
import type { Scope } from '@/services/ports'
import { ScopeSheet } from './ScopeSheet'
import { formatBRL } from '@/lib/money'
import { BottomSheet, SheetActionCard } from '@/ui/BottomSheet'
import { ConfirmSheet } from '@/ui/ConfirmSheet'
import { Button } from '@/ui/Button'
import { CheckIcon, CopyIcon, EditIcon, PaidIcon, UnpaidIcon } from '@/ui/icons'
import { copyText } from '@/ui/share'
import { useTransactionEditor } from '@/features/transactions/transactionEditorContext'
import { useCategories } from '@/features/accounts/hooks'
import { useMemberName } from '@/features/ledgers/useMemberName'
import { dayLabel } from '@/lib/dates'

interface TransactionSheetProps {
  transaction: Transaction
  onClose: () => void
  onTogglePaid: (transaction: Transaction) => void
  onDelete: (transaction: Transaction, scope?: Scope) => void
}

/**
 * Action labels say what will happen, not what is true now: a control that reads
 * as a status leaves you guessing which way it will move.
 *
 * Deleting sits in a block of its own, with the sentence that answers the
 * question someone actually hesitates over — the same shape as archiving an
 * account and removing a category. There is no divider above it, because the
 * block already separates itself; a rule as well would be saying the same thing
 * twice.
 *
 * It asks first. Marking something paid can be undone from the notice that
 * follows it; deleting cannot be undone at all, and the two sit two taps apart
 * in the same sheet.
 */
export function TransactionSheet({
  transaction,
  onClose,
  onTogglePaid,
  onDelete,
}: TransactionSheetProps) {
  const editor = useTransactionEditor()
  const [deleting, setDeleting] = useState(false)
  const [scoping, setScoping] = useState<'edit' | 'delete' | null>(null)

  const recurring = transaction.recurring_series_id !== null

  const categories = useCategories()
  const author = useMemberName(transaction.created_by_id)

  const paid = transaction.paid_at !== null
  const income = transaction.kind === 'income'
  const payLabel = paid ? (income ? 'Não recebida' : 'Não paga') : income ? 'Recebida' : 'Paga'

  const category = (categories.data ?? []).find((c) => c.id === transaction.category_id)

  return (
    <>
      <BottomSheet
        title={transaction.description}
        subtitle={formatBRL(transaction.amount_cents)}
        onClose={onClose}
        actions={
          <span className="flex items-center gap-2">
            <span className="text-sm text-muted">{dayLabel(transaction.date)}</span>
            <CopyName text={transaction.description} />
          </span>
        }
        grab={
          /* Two lines, not a panel: the heading already carries what the row is
             and what it cost, and a card around these would announce them as a
             section of their own. They live in the grab area because nothing
             here is tapped — which makes the top third of the sheet one target
             for the pull that closes it. */
          <dl className="pt-3">
            <Detail
              label="Categoria"
              value={
                category
                  ? [category.icon, category.name].filter(Boolean).join(' ')
                  : 'Sem categoria'
              }
            />
            {author && <Detail label="Lançado por" value={author} />}
          </dl>
        }
      >
        <div className="grid grid-cols-2 gap-2 pt-1">
          <SheetActionCard
            label={payLabel}
            icon={paid ? UnpaidIcon : PaidIcon}
            onClick={() => {
              onTogglePaid(transaction)
              onClose()
            }}
          />

          <SheetActionCard
            label="Editar"
            icon={EditIcon}
            onClick={() => {
              if (recurring) {
                setScoping('edit')

                return
              }

              editor.openEdit(transaction.id)
              onClose()
            }}
          />
        </div>

        <div className="mt-4 rounded-card bg-surface p-4">
          <p className="text-xs leading-relaxed text-muted">
            Excluir apaga este lançamento do mês. O saldo da conta volta ao que era antes dele, e
            não dá para desfazer.
          </p>

          <Button
            type="button"
            variant="danger"
            className="mt-3 w-full"
            onClick={() => (recurring ? setScoping('delete') : setDeleting(true))}
          >
            Excluir lançamento
          </Button>
        </div>
      </BottomSheet>

      {scoping && (
        <ScopeSheet
          action={scoping}
          onClose={() => setScoping(null)}
          onChoose={(scope) => {
            setScoping(null)

            if (scoping === 'edit') {
              editor.openEdit(transaction.id, scope)
              onClose()

              return
            }

            onDelete(transaction, scope)
            onClose()
          }}
        />
      )}

      {deleting && (
        <ConfirmSheet
          danger
          title={`Excluir ${transaction.description}?`}
          message={`${formatBRL(transaction.amount_cents)} sai do mês e do saldo da conta. Isso não pode ser desfeito.`}
          confirmLabel="Excluir"
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            onDelete(transaction)
            onClose()
          }}
        />
      )}
    </>
  )
}

/**
 * The label is a chip and the value is not.
 *
 * They are different kinds of thing — one names a field, the other is the
 * answer — and setting them in the same weight of text makes the eye read a
 * sentence. The chip is quiet enough to skip when you already know the shape of
 * the row and there when you do not.
 */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3">
      <dt className="shrink-0 rounded-chip bg-sunken px-2 py-0.5 text-xs font-medium text-muted">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right text-[0.9375rem] text-ink">{value}</dd>
    </div>
  )
}

/**
 * The row's name, onto the clipboard.
 *
 * Most new rows are old rows again — the same market, the same pharmacy — and
 * the way to reuse a name on a phone was to long-press the heading and fight
 * the selection handles. One tap here, then paste in the form.
 *
 * The tick is the only feedback: a toast for a copy would be louder than the
 * action, and the heading it copied is right there to compare against.
 */
function CopyName({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return

    const timer = setTimeout(() => setCopied(false), 1500)

    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      aria-label={copied ? 'Nome copiado' : 'Copiar nome'}
      onClick={() => {
        void copyText(text).then((ok) => setCopied(ok))
      }}
      className={`grid size-8 shrink-0 place-items-center rounded-xl bg-sunken ${copied ? 'text-in' : 'text-ink'}`}
    >
      {copied ? (
        <CheckIcon className="size-4" strokeWidth={2} aria-hidden="true" />
      ) : (
        <CopyIcon className="size-4" strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  )
}
