interface AvatarProps {
  name: string
  url?: string | null
}

/**
 * The face in the corner is what the references use to say "this is yours".
 *
 * Falls back to an initial rather than a placeholder silhouette: a letter that
 * is actually the user's reads as identity, while a generic head reads as
 * missing data.
 */
export function Avatar({ name, url }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="size-9 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white"
    >
      {initial}
    </span>
  )
}
