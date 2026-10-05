import { useState } from 'react'
import { OptionSheet } from '@/ui/OptionSheet'
import { ChevronRightIcon } from '@/ui/icons'
import type { LedgerMember } from '@/services/types'

interface AuthorPickerProps {
  members: LedgerMember[]
  /** The member who entered the row now, or null when nobody is recorded. */
  value: string | null
  onChange: (memberId: string) => void
}

/**
 * Whose row it is, and the way to hand it on.
 *
 * Only the owner is shown this. A row's author is how a shared ledger knows who
 * entered what, so changing it is a power over other people's names and not an
 * edit like the others — the screen only offers it to someone the server will
 * let do it. The server is what decides; this just does not ask a guest for a
 * thing they will be refused.
 *
 * The email is the second line because two people can share a first name, and
 * it is what the filter by person shows too.
 */
export function AuthorPicker({ members, value, onChange }: AuthorPickerProps) {
  const [open, setOpen] = useState(false)
  const chosen = members.find((member) => member.id === value)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-13 w-full items-center gap-3 text-left"
      >
        <span className="text-sm text-muted">Lançado por</span>

        <span className="min-w-0 flex-1 truncate text-right text-base text-ink">
          {chosen ? name(chosen) : 'Escolher'}
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-faint" />
      </button>

      {open && (
        <OptionSheet
          title="Lançado por"
          options={members.map((member) => ({
            value: member.id,
            label: name(member),
            caption: member.email,
          }))}
          value={value ?? ''}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function name(member: LedgerMember): string {
  return member.you ? `${member.name} (você)` : member.name
}
