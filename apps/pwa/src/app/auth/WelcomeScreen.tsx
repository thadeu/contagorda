import { useState } from 'react'
import { useDocumentCanvas } from '../../ui/useDocumentCanvas'
import { redirectToSignIn, redirectToSignUp } from './signIn'

/**
 * The way in.
 *
 * Sending a signed-out visitor straight to Clowk works, but it hands them off
 * to another domain before the app has said what it is — and if anything goes
 * wrong on the way back, an automatic redirect can loop with nowhere to stop.
 * A screen with two buttons puts the decision in their hands and gives a
 * failure somewhere to land.
 *
 * This is where the dark surface earns its keep: full screen, once, before the
 * light app begins.
 */
export function WelcomeScreen() {
  const [going, setGoing] = useState<'in' | 'up' | null>(null)

  useDocumentCanvas('brand')

  function leave(where: 'in' | 'up') {
    setGoing(where)
    void (where === 'in' ? redirectToSignIn() : redirectToSignUp())
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col overflow-y-auto bg-brand px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)] text-white">
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-sm text-white/50">Conta Gorda</p>
        <h1 className="max-w-[14ch] pt-2 text-[2.5rem] leading-[1.1] font-bold tracking-[-0.02em]">
          O que falta pagar este mês.
        </h1>
        <p className="max-w-[26ch] pt-4 text-[0.9375rem] leading-relaxed text-white/60">
          Lance o que entra e o que sai, marque o que já pagou, e veja quanto ainda falta.
        </p>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => leave('in')}
          disabled={going !== null}
          className="min-h-13 rounded-full bg-accent text-[0.9375rem] font-semibold text-brand disabled:opacity-60"
        >
          {going === 'in' ? 'Abrindo…' : 'Entrar'}
        </button>

        <button
          type="button"
          onClick={() => leave('up')}
          disabled={going !== null}
          className="min-h-13 rounded-full bg-white/10 text-[0.9375rem] font-semibold text-white disabled:opacity-60"
        >
          {going === 'up' ? 'Abrindo…' : 'Criar conta'}
        </button>
      </div>
    </div>
  )
}
