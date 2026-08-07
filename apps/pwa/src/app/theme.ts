import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'contagorda:theme'

/**
 * Which theme is on, and how it gets turned on.
 *
 * The whole switch is one attribute. `tokens.css` defines the palette at `:root`
 * and repoints every semantic token under `html[data-theme='dark']`, so nothing
 * in the app knows which theme it is in — a component asks for `bg-surface` and
 * gets whichever surface is current. That is the payoff of naming colours after
 * their job instead of after what they look like.
 *
 * The choice is a device preference, not a profile field. It belongs to the
 * phone in your hand rather than to the ledger, and syncing it would mean a
 * theme changing under one person because the other switched. `localStorage`
 * rather than the URL for the same reason: it survives a reinstall of the tab,
 * and nobody wants to share a link that changes how the app looks.
 */

/** What the app opens as, before anybody has chosen. */
const FALLBACK: Theme = 'dark'

let current: Theme = read()
const listeners = new Set<() => void>()

function read(): Theme {
  try {
    const stored = localStorage.getItem(KEY)

    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* Locked-down storage. The fallback is a perfectly good answer. */
  }

  return FALLBACK
}

/**
 * Runs before React, from `main.tsx`.
 *
 * The document opens marked dark, so a light-theme user would otherwise see the
 * dark palette painted and then swapped — and the swap is the whole screen, not
 * a detail of it.
 */
export function applyStoredTheme(): void {
  paint(current)
}

function paint(theme: Theme): void {
  const root = document.documentElement

  if (theme === 'dark') {
    root.dataset.theme = 'dark'
  } else {
    delete root.dataset.theme
  }

  /**
   * The browser's own chrome follows too — the address bar in a tab, the strip
   * behind the clock in the installed app. Left alone it keeps the dark colour
   * from the document head and frames a light app in a dark border.
   */
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg-appshell').trim())
}

export function setTheme(theme: Theme): void {
  current = theme
  paint(theme)

  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* The theme still applies for this session; it just will not be remembered. */
  }

  listeners.forEach((notify) => notify())
}

/**
 * A store outside React, because the thing being changed is outside React: the
 * attribute lives on `<html>`, above the root the app is mounted into. Holding
 * it in a context would mean the value and the document could disagree, and the
 * document is the one that decides what anybody sees.
 */
export function useTheme(): Theme {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)

      return () => listeners.delete(notify)
    },
    () => current,
    () => FALLBACK,
  )
}
