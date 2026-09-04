import type { ReactNode } from 'react'
import { useDocumentCanvas } from '@/ui/useDocumentCanvas'
import { PigMark } from '@/ui/PigMark'
import { LockIcon } from '@/ui/icons'

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

        <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-[#aaa198]">
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
function CardStack() {
  return (
    <div aria-hidden="true" className="welcome-stack relative mt-[calc(env(safe-area-inset-top)+1rem)] shrink-0">
      <div className="welcome-card welcome-card-back bg-[#1f6f6b]" />
      <div className="welcome-card welcome-card-mid bg-brand-soft" />
      
      <div className="welcome-card welcome-card-front">
        <PigMark className="absolute top-[10%] left-[9%] w-[24%]" />
        <div className="absolute right-0 bottom-[16%] h-[9%] w-[46%] rounded-l-full bg-white/25" />
      </div>
    </div>
  )
}
