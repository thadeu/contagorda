import { useState } from 'react'
import { BottomSheet } from '@/ui/BottomSheet'
import { NavButton } from '@/ui/NavBar'
import { CheckIcon, ClearIcon } from '@/ui/icons'
import { SORTS, type Sort } from '@/features/transactions/sorting'

interface FilterSheetProps {
  sort: Sort
  onSortChange: (sort: Sort) => void
  onClose: () => void
}

/**
 * How the list is ordered.
 *
 * Paid-or-pending used to be in here too, and moved out to a toggle in the list
 * header: it is flicked constantly, and sorting is the question asked once a
 * session, so only sorting is worth the cost of a sheet.
 *
 * It stays open after a choice and there is no apply button. The choice is held
 * here as a draft and written when the sheet closes — by swipe, backdrop or
 * escape, all of which mean "done". Re-sorting the list behind a sheet that is
 * still open is motion nobody asked to watch, and a tick that does the same as
 * closing is a second way to do one thing.
 *
 * Clearing goes back to the default and greys out when it is already there,
 * which is the only honest way to say a reset would do nothing.
 */
export function FilterSheet({ sort, onSortChange, onClose }: FilterSheetProps) {
  const [draft, setDraft] = useState<Sort>(sort)
  const untouched = draft === 'date'

  function close() {
    if (draft !== sort) onSortChange(draft)

    onClose()
  }

  return (
    <BottomSheet
      title="Ordenar"
      onClose={close}
      actions={
        <NavButton
          icon={ClearIcon}
          label="Voltar ao padrão"
          disabled={untouched}
          onClick={() => setDraft('date')}
        />
      }
    >
      <Group label="Ordenar por">
        {SORTS.map((option) => (
          <Choice
            key={option.value}
            label={option.label}
            chosen={option.value === draft}
            onClick={() => setDraft(option.value)}
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
  chosen,
  onClick,
}: {
  label: string
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
      <span className="text-[0.9375rem] text-ink">{label}</span>

      {chosen && <CheckIcon className="size-4 shrink-0 text-accent" />}
    </button>
  )
}
