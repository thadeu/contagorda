import { useState } from 'react'
import { BottomSheet } from '@/ui/BottomSheet'
import { Button } from '@/ui/Button'
import { usePanelHost } from '@/app/layout/panelHost'
import { NavButton } from '@/ui/NavBar'
import { Switch } from '@/ui/Switch'
import { CheckIcon, ClearIcon } from '@/ui/icons'
import { SORTS } from '@/features/transactions/sorting'
import type { ListView } from '@/features/transactions/useStatusFilter'
import type { Person } from '@/features/transactions/people'

interface FilterSheetProps {
  view: ListView
  /** Who entered something this month. Empty or a single person hides the group. */
  people: Person[]
  /** How many rows of the month belong to a series. */
  recurringCount: number
  onApply: (view: ListView) => void
  onClose: () => void
}

const DEFAULT: ListView = { sort: 'date', recurring: false, by: null }

/**
 * What the list shows and in what order.
 *
 * Paid-or-pending lives in the list header and not in here: it is flicked
 * constantly, and these are questions asked once in a while. Everything else
 * about the list is here, in one place — recurring only, one person's rows, and
 * the order.
 *
 * It stays open after a choice. The choices are held here as a draft and written
 * when the sheet closes, however it closes: a swipe, the backdrop, escape, or the
 * button at the foot. Re-filtering the list behind a sheet that is still open is
 * motion nobody asked to watch.
 *
 * The button is for the people who have no swipe and no backdrop to tap. On the
 * phone it does what every other way out does and closes. On the desktop it
 * applies and leaves the panel where it is: the list is beside it, and filtering
 * is a back and forth until the list is right. Closing the panel is the X.
 *
 * Clearing goes back to the defaults and greys out when everything is already
 * there, which is the only honest way to say a reset would do nothing.
 */
export function FilterSheet({ view, people, recurringCount, onApply, onClose }: FilterSheetProps) {
  const [draft, setDraft] = useState<ListView>(view)

  // The desktop panel stays open to be used again; the phone sheet is done once
  // the choices are made.
  const stays = usePanelHost() !== null

  const untouched =
    draft.sort === DEFAULT.sort && draft.recurring === DEFAULT.recurring && draft.by === DEFAULT.by

  const changed =
    draft.sort !== view.sort || draft.recurring !== view.recurring || draft.by !== view.by

  /*
   * One person is not a choice: every row is theirs, and the filter would only
   * restate the month. Unless it is already on, when it has to stay to be undone.
   */
  const choosePerson = people.length > 1 || draft.by !== null

  function close() {
    if (changed) onApply(draft)

    onClose()
  }

  return (
    <BottomSheet
      title="Filtrar e ordenar"
      onClose={close}
      expandable
      footer={(finish) => (
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            if (!stays) return finish()

            if (changed) onApply(draft)
          }}
        >
          Aplicar filtros
        </Button>
      )}
      actions={
        <NavButton
          icon={ClearIcon}
          label="Limpar filtros"
          disabled={untouched}
          onClick={() => setDraft(DEFAULT)}
        />
      }
    >
      <Group label="Mostrar">
        <div className="flex min-h-12 items-center justify-between gap-3 px-3">
          <span className="min-w-0">
            <span className="block text-[0.9375rem] text-ink">Só recorrentes</span>
            <span className="block text-xs text-muted">
              {recurringCount === 1 ? '1 lançamento no mês' : `${recurringCount} lançamentos no mês`}
            </span>
          </span>

          <Switch
            checked={draft.recurring}
            onChange={(recurring) => setDraft({ ...draft, recurring })}
            label="Só recorrentes"
          />
        </div>
      </Group>

      {choosePerson && (
        <Group label="Pessoas">
          {people.map((person) => (
            <Choice
              key={person.id}
              label={person.name}
              caption={person.email}
              count={person.count}
              chosen={person.id === draft.by}
              onClick={() => setDraft({ ...draft, by: person.id === draft.by ? null : person.id })}
            />
          ))}
        </Group>
      )}

      <Group label="Ordenar por">
        {SORTS.map((option) => (
          <Choice
            key={option.value}
            label={option.label}
            chosen={option.value === draft.sort}
            onClick={() => setDraft({ ...draft, sort: option.value })}
          />
        ))}
      </Group>
    </BottomSheet>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="pb-2">
      <p className="px-3 pt-2 pb-1 text-[0.6875rem] font-medium tracking-[0.08em] text-faint uppercase">
        {label}
      </p>

      {children}
    </section>
  )
}

function Choice({
  label,
  caption,
  count,
  chosen,
  onClick,
}: {
  label: string
  caption?: string
  count?: number
  chosen: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={chosen}
      className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left"
    >
      <span className="min-w-0">
        <span className="block truncate text-[0.9375rem] text-ink">{label}</span>

        {caption && <span className="block truncate text-xs text-muted">{caption}</span>}
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {count !== undefined && <span className="tnum text-sm text-muted">{count}</span>}

        {chosen && <CheckIcon className="size-4 shrink-0 text-accent" />}
      </span>
    </button>
  )
}
