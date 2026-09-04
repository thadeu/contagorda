import { useState } from 'react'
import { WelcomeFrame } from './WelcomeFrame'
import { redirectToSignIn, redirectToSignUp } from './signIn'

/**
 * The way in.
 *
 * Sending a signed-out visitor straight to Clowk works, but it hands them off
 * to another domain before the app has said what it is — and if anything goes
 * wrong on the way back, an automatic redirect can loop with nowhere to stop.
 * A screen with two buttons puts the decision in their hands and gives a
 * failure somewhere to land.
 */
export function WelcomeScreen() {
  const [going, setGoing] = useState<'in' | 'up' | null>(null)

  function leave(where: 'in' | 'up') {
    setGoing(where)
    void (where === 'in' ? redirectToSignIn() : redirectToSignUp())
  }

  return (
    <WelcomeFrame
      actions={
        <>
          <button
            type="button"
            onClick={() => leave('up')}
            disabled={going !== null}
            className="min-h-12 rounded-full bg-brand text-[0.9375rem] font-semibold text-white disabled:opacity-60"
          >
            {going === 'up' ? 'Abrindo…' : 'Começar agora'}
          </button>

          <button
            type="button"
            onClick={() => leave('in')}
            disabled={going !== null}
            className="min-h-11 rounded-full text-[0.9375rem] font-semibold text-accent-ink disabled:opacity-60"
          >
            {going === 'in' ? 'Abrindo…' : 'Já tenho uma conta'}
          </button>
        </>
      }
    />
  )
}
