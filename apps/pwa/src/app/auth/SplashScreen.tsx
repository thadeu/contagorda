import { WelcomeFrame } from './WelcomeFrame'
import { PigDrawing } from '@/ui/PigDrawing'

/**
 * The first thing on screen.
 *
 * It shows while the provider rebuilds the session, which is a few hundred
 * milliseconds on a warm start and longer on a cold one. It is the welcome
 * screen with nothing to press yet: a signed-out visitor sees the buttons
 * appear in place, and a signed-in one sees the app replace it. Neither gets
 * a screen that exists only to be waited on.
 *
 * The pig draws itself where the buttons will be. An empty slot reads as a
 * screen that forgot something; the mark taking shape says the rest is on
 * its way.
 */
export function SplashScreen() {
  return (
    <WelcomeFrame
      actions={
        <div className="flex min-h-12 items-center justify-center">
          <PigDrawing className="size-16" reverse />
        </div>
      }
    />
  )
}
