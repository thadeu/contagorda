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

  const [typed, setTyped] = useState(String(draft.repeats))
  const [on, setOn] = useState(value !== null)

  /**
   * Nothing leaves this sheet until it closes.
   *
   * Applying each keystroke to the form behind it re-rendered the whole tree on
   * every character, and on iOS that closed and reopened the keyboard between
   * one digit and the next. The rule is edited here, in one place, and the form
   * hears about it once — on the way out, by whichever route: the backdrop, a
   * drag, or Escape all pass through here.
   */
  function commitAndClose() {
    onChange(on ? draft : null)
    onClose()
  }

  return (
    <BottomSheet
      title="Repetir"
      onClose={commitAndClose}
      actions={
        <Switch checked={on} onChange={setOn} label="Repetir este lançamento" />
      }
    >
      {/* The form is always here, and dimmed when the switch is off. Showing it
          only when it applies makes the sheet jump on the first tap and hides
          what the switch is even for; disabled, it is the answer to "what will
          this do", visible before anything is committed to.

          It is also why nothing needs a confirming button: the sheet is the
          question, and closing it is the answer. */}
      <div
        aria-disabled={!on}
        className={`grid gap-4 px-3 pb-2 ${on ? '' : 'pointer-events-none opacity-40'}`}
      >
        <Field label="A cada">
          {FREQUENCIES.map((option) => (
            <Chip
              key={option.value}
              active={draft.frequency === option.value}
              disabled={!on}
              onClick={() => update({ frequency: option.value })}
            >
              {option.label}
            </Chip>
          ))}
        </Field>

        {/* Typed, not chosen from a set. Any list of counts is somebody's guess
            at how long a thing lasts, and the one number missing from it is
            always the one being entered — including 1, which is "and again next
            month" and the shortest series there is. */}
        <label className="flex min-h-13 items-center gap-3">
          <span className="min-w-0 flex-1 text-sm text-muted">Se repete por</span>

          <input
            value={typed}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '')

              setTyped(digits)
              update({ repeats: digits === '' ? 0 : Number(digits) })
            }}
            onBlur={() => setTyped(String(draft.repeats))}
            disabled={!on}
            inputMode="numeric"
            aria-label="Quantas vezes se repete"
            size={3}
            className="tnum w-14 bg-transparent text-right text-base text-ink outline-none"
          />

          <span className="shrink-0 text-sm text-muted">{unit(draft)}</span>
        </label>

        <p className="text-sm leading-relaxed text-muted">
          {on ? describe(date, draft) : 'Este lançamento acontece uma vez só.'}
          {on && clamped(date, draft) &&
            ' Alguns meses não têm esse dia, então esses caem no último dia do mês.'}
        </p>
      </div>
    </BottomSheet>
  )

  function update(patch: Partial<Recurrence>) {
    setDraft({ ...draft, ...patch })
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
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
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

