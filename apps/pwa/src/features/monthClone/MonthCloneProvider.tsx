import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMonth } from '@/app/useMonth'
import { monthLabel } from '@/lib/dates'
import type { MonthClone } from '@/services/types'
import { Notice } from '@/ui/Notice'
import { Spinner } from '@/ui/Spinner'
import { useRefreshMonth } from '@/features/transactions/hooks'
import { CloneMonthSheet } from './components/CloneMonthSheet'
import { useMonthClone, useStartMonthClone } from './hooks'
import { MonthClonerContext, type MonthCloner } from './monthCloneContext'

/** How long the "done" notice stays before it leaves on its own. */
const DONE_VISIBLE_MS = 5000

export function MonthCloneProvider({ children }: { children: ReactNode }) {
  const { setMonth } = useMonth()
  const start = useStartMonthClone()

  const [source, setSource] = useState<string | null>(null)
  const [running, setRunning] = useState<MonthClone | null>(null)

  const cloner = useMemo<MonthCloner>(() => ({ openFrom: setSource }), [])

  function begin(from: string, target: string) {
    start.mutate(
      { source: from, target },
      {
        onSuccess: (clone) => {
          setRunning(clone)
          setSource(null)

          // Onto the month that is filling, so the rows are seen arriving.
          setMonth(target)
        },
      },
    )
  }

  return (
    <MonthClonerContext value={cloner}>
      {children}

      {source && (
        <CloneMonthSheet
          source={source}
          pending={start.isPending}
          error={start.error?.message ?? null}
          onSubmit={(target) => begin(source, target)}
          onClose={() => {
            start.reset()
            setSource(null)
          }}
        />
      )}

      {running && (
        <CloneProgress
          key={running.id}
          initial={running}
          onRetry={() => begin(running.source_month, running.target_month)}
          onDismiss={() => setRunning(null)}
        />
      )}
    </MonthClonerContext>
  )
}

interface CloneProgressProps {
  initial: MonthClone
  onRetry: () => void
  onDismiss: () => void
}

/**
 * The copy, reported where the system reports things.
 *
 * It asks the server how far the job has got and, every time that moves, asks
 * the target month again — which is what makes the rows appear one batch at a
 * time under the notice instead of all at the end.
 *
 * Not dismissible while it runs. Leaving is fine, the job carries on, but a
 * notice that can be flicked away mid-copy is one the person cannot get back,
 * and there would be no way left to see that it finished or failed.
 */
function CloneProgress({ initial, onRetry, onDismiss }: CloneProgressProps) {
  const { data: clone, isError } = useMonthClone(initial)
  const refresh = useRefreshMonth(clone.target_month)

  useEffect(() => {
    void refresh()
  }, [refresh, clone.copied, clone.status])

  useEffect(() => {
    if (clone.status !== 'done') return

    const timer = setTimeout(onDismiss, DONE_VISIBLE_MS)

    return () => clearTimeout(timer)
  }, [clone.status, onDismiss])

  useEffect(() => {
    if (isError) onDismiss()
  }, [isError, onDismiss])

  const target = monthLabel(clone.target_month)

  if (clone.status === 'failed') {
    return (
      <Notice role="alert" onDismiss={onDismiss}>
        <p className="text-[0.9375rem] font-semibold text-ink">Não conseguimos copiar tudo</p>
        <p className="pt-1 text-sm leading-relaxed text-muted">
          O que já foi copiado continua em {target}. Tente de novo para terminar.
        </p>

        <button
          type="button"
          onClick={() => {
            onDismiss()
            onRetry()
          }}
          className="mt-3 min-h-10 w-full rounded-2xl bg-sunken px-4 text-sm font-semibold text-ink"
        >
          Tentar de novo
        </button>
      </Notice>
    )
  }

  if (clone.status === 'done') {
    return (
      <Notice onDismiss={onDismiss}>
        <p className="text-[0.9375rem] font-semibold text-ink">{doneTitle(clone)}</p>

        {clone.skipped > 0 && (
          <p className="pt-1 text-sm leading-relaxed text-muted">
            {clone.skipped === 1 ? '1 ficou de fora' : `${clone.skipped} ficaram de fora`}:
            recorrentes que já estavam no mês, recorrentes que não são mensais e lançamentos de
            contas arquivadas.
          </p>
        )}
      </Notice>
    )
  }

  const counting = clone.total > 0

  return (
    <Notice>
      <div className="flex items-center gap-3">
        <Spinner className="text-[1.25rem]" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-semibold text-ink">
            Copiando para <span className="first-letter:uppercase">{target}</span>
          </p>

          <p className="tnum text-xs text-muted">
            {counting ? `${clone.copied} de ${clone.total} lançamentos` : 'Preparando…'}
          </p>
        </div>
      </div>

      {counting && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={clone.total}
          aria-valuenow={clone.copied}
          aria-label="Lançamentos copiados"
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${(clone.copied / clone.total) * 100}%` }}
          />
        </div>
      )}
    </Notice>
  )
}

function doneTitle(clone: MonthClone): string {
  if (clone.total === 0) return 'Nada para copiar'

  const noun = clone.copied === 1 ? 'lançamento copiado' : 'lançamentos copiados'

  return `${clone.copied} ${noun}`
}
