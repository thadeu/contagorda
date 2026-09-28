import { useEffect, useState, type ReactNode } from 'react'
import { useDocumentCanvas } from '@/ui/useDocumentCanvas'
import { PigMark } from '@/ui/PigMark'
import { LockIcon } from '@/ui/icons'
import { useIsDesktop } from '@/app/useIsDesktop'

/**
 * The screen the app opens on, whether or not anyone is signed in.
 *
 * The splash and the welcome screen are the same picture; the only difference
 * is whether there is something to press yet. Sharing the frame means the boot
 * settles into the login without a cut — the cards, the heading and the
 * footer stay where they are and the buttons arrive in the space kept for
 * them.
 *
 * White, in both themes. This is the app icon opened up: the pig on its white
 * tile, now on a card in a stack of cards that runs off the right edge — the
 * app is about what is on the cards, and the pile says "several" without
 * counting. The stack is pure CSS so it scales with the viewport and picks up
 * the accent from the theme tokens rather than from an image.
 *
 * The same markup lives in `index.html` so the moment before React mounts
 * looks identical to the moment after. Change one, change both.
 *
 * The footer names Clowk before the redirect does. Being sent to another
 * domain to log in is disorienting the first time; a visitor who has just read
 * the name is not surprised by the address bar.
 */
export function WelcomeFrame({ actions }: { actions: ReactNode }) {
  useDocumentCanvas('surface')

  const desktop = useIsDesktop()

  if (desktop) {
    return <DesktopWelcome actions={actions} />
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col overflow-x-hidden overflow-y-auto bg-white text-[#16130f]">
      <CardStack />

      <div className="flex flex-1 flex-col justify-end px-7 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <h1 className="max-w-[12ch] text-[2rem] leading-[1.1] font-bold tracking-[-0.02em]">
          Bem-vindo ao Conta Gorda
        </h1>

        <p className="max-w-[30ch] pt-3 text-[0.9375rem] leading-relaxed text-[#78706a] [@media(max-height:640px)]:hidden">
          Lance o que entra e o que sai, marque o que já pagou, e veja quanto ainda falta.
        </p>

        <div className="grid min-h-[6.25rem] gap-1 pt-6">{actions}</div>

        <SecuredBy className="justify-center pt-2" />
      </div>
    </div>
  )
}

/**
 * Three cards, fanned, running off the right edge.
 *
 * All three share one transform so they read as one pile seen from one angle;
 * only the offset and the colour change from card to card. The front card
 * carries the mark and a pale band where a card would carry its number — a
 * hint of a card, not a drawing of one.
 */
/**
 * The same welcome, laid out for a window instead of a phone.
 *
 * Content on the left, as everywhere else on the desktop: the words and the
 * buttons start at the left edge and keep a narrow measure, and the cards take
 * the rest of the width as the picture. Centring a phone column in a wide
 * window left it floating in a dark page with nothing either side of it.
 *
 * The colours stay literal, like the phone frame's: this screen is shown before
 * any theme has been chosen, and it is white in both.
 */
function DesktopWelcome({ actions }: { actions: ReactNode }) {
  return (
    <div className="grid h-full grid-cols-[minmax(26rem,36rem)_1fr] bg-white text-[#16130f]">
      <div className="flex flex-col overflow-y-auto px-14 py-12">
        <div className="flex items-center gap-2.5">
          <PigMark className="size-8" />
          <span className="text-base font-bold tracking-[-0.01em]">Conta Gorda</span>
        </div>

        <div className="flex max-w-[22rem] flex-1 flex-col justify-center py-10">
          <h1 className="text-[2.5rem] leading-[1.05] font-bold tracking-[-0.025em]">
            Bem-vindo ao Conta Gorda
          </h1>

          <p className="pt-4 text-base leading-relaxed text-[#78706a]">
            Lance o que entra e o que sai, marque o que já pagou, e veja quanto ainda falta.
          </p>

          <div className="grid min-h-[8rem] gap-1 pt-8">{actions}</div>
        </div>

        <SecuredBy />
      </div>

      <div className="relative overflow-hidden bg-[#f4f0eb]">
        <CardStack wide />
      </div>
    </div>
  )
}

function SecuredBy({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs text-[#aaa198] ${className}`}>
      <LockIcon className="size-3.5" />

      <span>
        Secured by{' '}
        <a
          href="https://clowk.in"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#78706a] underline-offset-2 hover:underline"
        >
          Clowk.in
        </a>
      </span>
    </p>
  )
}

function CardStack({ wide = false }: { wide?: boolean }) {
  const turn = useCardTurn()

  return (
    <div
      aria-hidden="true"
      className={
        wide
          ? 'welcome-stack welcome-stack-wide'
          : 'welcome-stack relative mt-[calc(env(safe-area-inset-top)+1rem)] shrink-0'
      }
    >
      {CARDS.map((card, index) => {
        const position = POSITIONS[(((index - turn) % CARDS.length) + CARDS.length) % CARDS.length]
        const leaving = position === 'back' && turn > 0

        return (
          <div
            key={card.last}
            className={`welcome-card welcome-card-${position} ${card.surface} text-white ${
              leaving ? 'welcome-card-leaving' : ''
            }`}
          >
            <CardFace last={card.last} expiry={card.expiry} />
          </div>
        )
      })}
    </div>
  )
}

const CARDS = [
  { surface: 'welcome-card-pink', last: '2026', expiry: '12/30' },
  { surface: 'bg-brand-soft', last: '0417', expiry: '08/29' },
  { surface: 'bg-[#1f6f6b]', last: '7730', expiry: '03/31' },
]

const POSITIONS = ['front', 'mid', 'back'] as const

/**
 * Long enough that the pile is still most of the time. The turn itself takes
 * 1.6s, so a card rests in front for over four seconds before it moves.
 */
const TURN_MS = 6000

/**
 * How many times the pile has turned. Card `i` sits at position `i - turn`,
 * so each turn sends the front card to the back and moves the others forward.
 *
 * Still for anyone who asked the system for less motion, and the interval is
 * cleared with the screen, which on a welcome screen is as soon as someone
 * signs in.
 */
function useCardTurn(): number {
  const [turn, setTurn] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => setTurn((current) => current + 1), TURN_MS)

    return () => window.clearInterval(timer)
  }, [])

  return turn
}

/**
 * A card dressed as a card: a chip, a number, a holder, an expiry and a network
 * mark, so the picture reads as a card at a glance rather than as a coloured
 * rectangle. Every card has the full face, because every card takes its turn
 * in front.
 *
 * Every size is a share of `--card-w`, the one width the stack is built from,
 * so the details scale with the card on a phone and on a monitor alike.
 */
function CardFace({ last, expiry }: { last: string; expiry: string }) {
  return (
    <>
      <PigMark className="absolute top-[10%] left-[8%] w-[18%]" />

      <div className="welcome-card-face absolute inset-0">
        <span className="absolute top-[12%] right-[8%] text-[calc(var(--card-w)*0.05)] font-bold tracking-[-0.01em] opacity-90">
          conta gorda
        </span>

        <CardChip />

        <p className="absolute top-[60%] left-[8%] font-mono text-[calc(var(--card-w)*0.058)] tracking-[0.12em] whitespace-nowrap">
          •••• •••• •••• {last}
        </p>

        <div className="absolute right-[8%] bottom-[9%] left-[8%] flex items-end gap-[6%]">
          <CardField label="Titular" value="SEU NOME" />
          <CardField label="Validade" value={expiry} />

          <NetworkMark />
        </div>
      </div>
    </>
  )
}

function CardChip() {
  return (
    <div className="absolute top-[36%] left-[8%] h-[16%] w-[14%] overflow-hidden rounded-[18%] bg-gradient-to-br from-[#f6dfa4] via-[#e4c177] to-[#c9a256] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]">
      <span className="absolute inset-y-0 left-1/3 w-px bg-black/20" />
      <span className="absolute inset-y-0 right-1/3 w-px bg-black/20" />
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
    </div>
  )
}

function CardField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[calc(var(--card-w)*0.028)] leading-none tracking-[0.12em] uppercase opacity-75">
        {label}
      </p>
      <p className="truncate pt-[0.35em] font-mono text-[calc(var(--card-w)*0.042)] leading-none tracking-[0.06em]">
        {value}
      </p>
    </div>
  )
}

/**
 * Two overlapping circles, in white at two strengths: enough to say "a card
 * network" without borrowing any network's own colours.
 */
function NetworkMark() {
  return (
    <div className="ml-auto flex h-[calc(var(--card-w)*0.1)] shrink-0 items-center">
      <span className="aspect-square h-full rounded-full bg-white/85" />
      <span className="-ml-[calc(var(--card-w)*0.04)] aspect-square h-full rounded-full bg-white/45" />
    </div>
  )
}
