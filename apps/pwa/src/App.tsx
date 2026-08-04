import { useEffect, useState } from 'react'
import { useAuth, useGetToken, SignInButton, SignOutButton } from '@clowk/react'
import { fetchMe, type Me } from './api'

export default function App() {
  const { signedIn, isLoading, user } = useAuth()
  const getToken = useGetToken()

  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!signedIn) return

    let cancelled = false

    fetchMe(getToken)
      .then((result) => {
        if (!cancelled) setMe(result)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })

    return () => {
      cancelled = true
    }
  }, [signedIn, getToken])

  if (isLoading) {
    return (
      <main>
        <p>Carregando…</p>
      </main>
    )
  }

  if (!signedIn) {
    return (
      <main>
        <h1>Conta Gorda</h1>
        <SignInButton>Entrar</SignInButton>
      </main>
    )
  }

  return (
    <main>
      <h1>Conta Gorda</h1>

      <section>
        <h2>Claims do token</h2>
        <p>{String(user?.email ?? '')}</p>
      </section>

      <section>
        <h2>Resposta da API</h2>
        {error && <p role="alert">{error}</p>}
        {me && (
          <dl>
            <dt>id</dt>
            <dd>{me.id}</dd>
            <dt>email</dt>
            <dd>{me.email}</dd>
            <dt>name</dt>
            <dd>{me.name}</dd>
          </dl>
        )}
        {!me && !error && <p>Consultando…</p>}
      </section>

      <SignOutButton>Sair</SignOutButton>
    </main>
  )
}
