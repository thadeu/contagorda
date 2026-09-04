import { useEffect, useState } from 'react'
import { Switch } from '@/ui/Switch'
import {
  disableBiometric,
  enrollBiometric,
  isBiometricAvailable,
  useBiometricEnabled,
} from '@/app/lock/biometric'

/**
 * The lock, as a row in the profile sheet.
 *
 * Off by default and off for good on a phone that cannot do it — the row
 * hides itself rather than offering a switch that snaps back. Turning it on
 * asks for the face right away, because that is the only way to find out the
 * phone will cooperate; if it will not, the switch stays off and the console
 * says why.
 */
export function BiometricSwitch({ userName }: { userName: string }) {
  const enabled = useBiometricEnabled()
  const [available, setAvailable] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    void isBiometricAvailable().then((ok) => {
      if (!cancelled) setAvailable(ok)
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (!available && !enabled) return null

  async function handleChange(next: boolean) {
    if (!next) {
      disableBiometric()

      return
    }

    setBusy(true)

    try {
      await enrollBiometric(userName)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-13 items-center justify-between gap-3 px-4">
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-medium text-ink">Biometria</span>
        <span className="block text-xs text-muted">
          {enabled ? 'Pede Face ID ou Touch ID ao abrir' : 'Desligada'}
        </span>
      </span>

      <span className={busy ? 'pointer-events-none opacity-50' : ''}>
        <Switch checked={enabled} onChange={handleChange} label="Biometria" />
      </span>
    </div>
  )
}
