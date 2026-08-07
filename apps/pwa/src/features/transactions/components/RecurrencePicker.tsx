import { useState } from 'react'
import { BottomSheet } from '../../../ui/BottomSheet'
import { Switch } from '../../../ui/Switch'
import { ChevronRightIcon } from '../../../ui/icons'
import { clamped, describe, FREQUENCIES, type Recurrence } from '../recurrence'
import type { IsoDate } from '../../../lib/dates'

interface RecurrencePickerProps {
  date: IsoDate
  value: Recurrence | null
  onChange: (recurrence: Recurrence | null) => void
}

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
          {value ? `${value.repeats + 1}× ${unit(value)}` : 'Não se repete'}
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
    value ?? { frequency: 'monthly', interval: 1, repeats: 11 },
  )

  const repeats = value !== null

  return (
    <BottomSheet
      title="Repetir"
      onClose={onClose}
      actions={
        <Switch
          checked={repeats}
          onChange={(on) => onChange(on ? draft : null)}
          label="Repetir este lançamento"
        />
      }
    >
      {/* Every change is already applied behind the sheet — the switch, the
          frequency, the number. There is nothing left to confirm, so there is no
          button confirming it: closing by any means leaves the same result, and
          a "done" would only raise the question of what happens without it. */}
      <div className="grid gap-4 px-3 pb-2">
        {!repeats && (
          <p className="text-sm leading-relaxed text-muted">
            Este lançamento acontece uma vez só.
          </p>
        )}

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

            {/* Typed, not chosen from a set. Any list of counts is somebody's
                guess at how long a thing lasts, and the one number missing from
                it is always the one being entered — including 1, which is
                "and again next month" and the shortest series there is. */}
            <label className="flex min-h-13 items-center gap-3">
              <span className="min-w-0 flex-1 text-sm text-muted">Se repete por</span>

              <input
                value={draft.repeats}
                onChange={(event) => update({ repeats: clean(event.target.value) })}
                inputMode="numeric"
                aria-label="Quantas vezes se repete"
                size={3}
                className="tnum w-14 bg-transparent text-right text-base text-ink outline-none"
              />

              <span className="shrink-0 text-sm text-muted">
                {draft.frequency === 'yearly'
                  ? draft.repeats === 1
                    ? 'ano'
                    : 'anos'
                  : draft.repeats === 1
                    ? 'mês'
                    : 'meses'}
              </span>
            </label>

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


function unit({ frequency, repeats }: Recurrence): string {
  if (frequency === 'yearly') return repeats === 0 ? 'ano' : 'anos'

  return repeats === 0 ? 'mês' : 'meses'
}

/**
 * An empty field is zero, not a crash, and nothing below one repetition is a
 * series. Typing is a state someone passes through — clearing the box to write
 * a different number must not throw away the rest of the rule.
 */
function clean(value: string): number {
  const digits = Number(value.replace(/\D/g, ''))

  return Number.isFinite(digits) ? Math.max(digits, 0) : 0
}
