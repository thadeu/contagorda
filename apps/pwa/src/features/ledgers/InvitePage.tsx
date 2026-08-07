import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAcceptInvite } from './hooks'
import { Button } from '@/ui/Button'
import { EmptyState } from '@/ui/EmptyState'

/**
 * Where an invite link lands.
 *
 * It accepts on arrival rather than asking first. Getting here already required
 * opening a link that was sent to you and signing in — a confirmation step would
 * be asking whether you meant the thing you just did twice.
 *
 * A spent, revoked or expired token says so plainly and offers the way on. It
 * does not explain which of the three it was: to someone holding a dead link the
 * distinction changes nothing, and to anyone probing tokens it is a hint.
 */
export function InvitePage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const accept = useAcceptInvite()
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current || token === '') return

    attempted.current = true
    accept.mutate(token, { onSuccess: () => navigate('/', { replace: true }) })
  }, [token, accept, navigate])

  if (accept.isError) {
    return (
      <EmptyState
        title="Convite não vale mais"
        hint="Ele pode ter expirado, já ter sido usado ou ter sido cancelado. Peça um novo a quem te convidou."
        action={<Button onClick={() => navigate('/', { replace: true })}>Ir para o app</Button>}
      />
    )
  }

  return <EmptyState title="Entrando no espaço…" hint="Só um instante." />
}
