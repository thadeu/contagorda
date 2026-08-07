import { setTheme, useTheme, type Theme } from '@/app/theme'
import { MoonIcon, SunIcon } from '@/ui/icons'

/**
 * Sun or moon, and nothing in between.
 *
 * Two states rather than three. "Follow the system" is the more thoughtful
 * option and the harder one to look at: the control shows neither sun nor moon
 * as chosen, or shows one of them without having been touched, and either way
 * somebody taps it to find out what it is doing. A POC is the wrong place to
 * spend that, and if it earns its way in later it is a third segment, not a
 * different control.
 *
 * A segmented control and not a toggle. A toggle has an on and an off, and
 * neither theme is the app being switched off — both are a choice, and the
 * control should show both as available rather than one as the absence of the
 * other.
 */
export function ThemeSwitch() {
  const theme = useTheme()

  return (
    <div className="flex shrink-0 gap-1 rounded-2xl bg-sunken p-1" role="group" aria-label="Aparência">
      <Segment theme="light" active={theme === 'light'} icon={<SunIcon className="size-4" />} label="Claro" />
      <Segment theme="dark" active={theme === 'dark'} icon={<MoonIcon className="size-4" />} label="Escuro" />
    </div>
  )
}

function Segment({
  theme,
  active,
  icon,
  label,
}: {
  theme: Theme
  active: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => setTheme(theme)}
      aria-pressed={active}
      aria-label={label}
      className={`grid size-8 place-items-center rounded-xl ${
        active ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.18)]' : 'text-faint'
      }`}
    >
      {icon}
    </button>
  )
}
