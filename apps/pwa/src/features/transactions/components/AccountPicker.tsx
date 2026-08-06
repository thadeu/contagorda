import { useState } from 'react'
import { OptionSheet } from '../../../ui/OptionSheet'
import { ChevronRightIcon } from '../../../ui/icons'
import type { Account } from '../../../services/types'

interface AccountPickerProps {
  accounts: Account[]
  value: string
  onChange: (accountId: string) => void
}

/**
 * The row shows which account, and opens a list to change it.
 *
 * Most entries land in the same account, so the answer being visible without a
 * tap is the whole point — and when it does need changing, one tap on a named
 * row beats spinning a wheel and confirming it.
 */
export function AccountPicker({ accounts, value, onChange }: AccountPickerProps) {
  const [open, setOpen] = useState(false)
  const chosen = accounts.find((account) => account.id === value)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-13 w-full items-center gap-3 text-left"
      >
        <span className="w-24 shrink-0 text-sm text-muted">Conta</span>

        <span className="min-w-0 flex-1 truncate text-right text-base text-ink">
          {chosen?.name ?? 'Escolher'}
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-faint" />
      </button>

      {open && (
        <OptionSheet
          title="Conta"
          options={accounts.map((account) => ({ value: account.id, label: account.name }))}
          value={value}
          onSelect={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
