import { useState } from 'react'
import { BottomSheet } from '../../../ui/BottomSheet'
import { NavButton } from '../../../ui/NavBar'
import { CheckIcon, ChevronRightIcon } from '../../../ui/icons'
import { clamped, describe, FREQUENCIES, type Recurrence } from '../recurrence'
import type { IsoDate } from '../../../lib/dates'

interface RecurrencePickerProps {
  date: IsoDate
  value: Recurrence | null
  onChange: (recurrence: Recurrence | null) => void
}

/** Enough for a year of months, or a decade of years. */
const COUNTS = [2, 3, 4, 6, 12, 24, 36]

/**
 * A row, not a block.
 *
 * Most entries do not repeat, and a block of controls on the form would charge
 * every one of them for a decision almost nobody makes. The row says what it is
 * — usually "não se repete" — and opens the question only when it matters.
 */
export function RecurrencePicker({ date, value, onChange }: RecurrencePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-13 w-full items-center gap-3 text-left"
      >
        <span className="w-24 shrink-0 text-sm text-muted">Repetir</span>

        <span className="min-w-0 flex-1 truncate text-right text-base text-ink">
          {value ? `${value.count}× ${unit(value)}` : 'Não se repete'}
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-faint" />
      </button>

      {open && (
        <RecurrenceSheet
          date={date}
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function RecurrenceSheet({
  date,
  value,
  onChange,
  onClose,
}: RecurrencePickerProps & { onClose: () => void }) {
  const [draft, setDraft] = useState<Recurrence>(
    value ?? { frequency: 'monthly', interval: 1, count: 12 },
  )

  const repeats = value !== null

  return (
    <BottomSheet
      title="Repetir"
      onClose={onClose}
      actions={
        <NavButton
          icon={CheckIcon}
          label="Pronto"
          onClick={() => {
            onChange(repeats ? draft : null)
            onClose()
          }}
        />
      }
    >
      <div className="grid gap-4 px-3 pb-2">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-sunken p-1" role="group">
          <Segment active={!repeats} onClick={() => onChange(null)}>
            Não
          </Segment>
          <Segment active={repeats} onClick={() => onChange(draft)}>
            Sim
          </Segment>
        </div>

        {repeats && (
          <>
            <Field label="A cada">
              {FREQUENCIES.map((option) => (
                <Chip
                  key={option.value}
                  active={draft.frequency === option.value}
                  onClick={() => update({ frequency: option.value })}
                >
                  {option.label}
                </Chip>
              ))}
            </Field>

            <Field label="Vezes">
              {COUNTS.map((count) => (
                <Chip key={count} active={draft.count === count} onClick={() => update({ count })}>
                  {String(count)}
                </Chip>
              ))}
            </Field>

            {/* The controls state a rule; this states its consequence, which is
                the part anyone actually agrees to. It is also where a clamped
                month shows itself — nobody reasons about February from an
                interval, and everybody recognises a date that landed early. */}
            <p className="text-sm leading-relaxed text-muted">
              {describe(date, draft)}
              {clamped(date, draft) &&
                ' Alguns meses não têm esse dia, então esses caem no último dia do mês.'}
            </p>
          </>
        )}
      </div>
    </BottomSheet>
  )

  function update(patch: Partial<Recurrence>) {
    const next = { ...draft, ...patch }

    setDraft(next)
    onChange(next)
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="pb-2 text-xs text-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-10 min-w-12 rounded-2xl px-4 text-sm font-medium ${
        active ? 'bg-accent text-brand' : 'bg-sunken text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-xl text-sm font-semibold ${
        active ? 'bg-inverse text-white' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}

function unit({ frequency, count }: Recurrence): string {
  if (frequency === 'yearly') return count === 1 ? 'ano' : 'anos'

  return count === 1 ? 'mês' : 'meses'
}
