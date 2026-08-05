interface ScreenHeaderProps {
  title: string
}

/**
 * Every screen opens on the dark band. Not decoration: with a translucent
 * status bar iOS draws the clock in white, so a light surface at the top of the
 * screen would make it unreadable.
 */
export function ScreenHeader({ title }: ScreenHeaderProps) {
  return (
    <header className="rounded-b-card bg-brand px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 text-white">
      <p className="text-sm text-white/60">Conta Gorda</p>
      <h1 className="pt-2 text-[1.75rem] leading-tight font-semibold tracking-tight">{title}</h1>
    </header>
  )
}
