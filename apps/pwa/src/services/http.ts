import { getActiveLedgerId } from '@/services/activeLedger'
import { uuid } from '@/lib/uuid'

/**
 * The one place that talks to the API.
 *
 * Everything the server needs on every call is added here rather than at the
 * call sites: the bearer token, the ledger, the idempotency key. A port that
 * had to remember them would be a port that can forget one.
 */
/**
 * Where the API answers. Without VITE_API_URL it is port 3000 on whatever host
 * served the app, so opening the PWA from a phone as http://192.168.x.x:5173
 * reaches the API on that same machine — a fixed 127.0.0.1 would be the phone
 * itself.
 */
const API_URL = import.meta.env.VITE_API_URL || `${location.protocol}//${location.hostname}:3000`

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * How the client asks for a token.
 *
 * Access tokens are short-lived, so a value read at render time can already be
 * stale by the time a request goes out. Asking at call time lets the SDK renew
 * first.
 *
 * It lives in a module rather than in context because `services` is built at
 * import time, above any React tree — see `provideToken` for how the tree hands
 * it down.
 */
type TokenSource = () => Promise<string | null>

let tokenSource: TokenSource = async () => null

export function provideToken(source: TokenSource): void {
  tokenSource = source
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  query?: Record<string, string | number | null | undefined>
  body?: unknown
  signal?: AbortSignal
  /** Creating POSTs only. A retry with the same key writes once. */
  idempotent?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal, idempotent } = options
  const token = await tokenSource()
  const ledgerId = getActiveLedgerId()

  const response = await fetch(`${API_URL}/api/v1${path}${search(query)}`, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),

      // Read at call time, never captured at import: switching ledgers has to
      // change where the next request lands, and a value closed over at startup
      // would keep answering for the ledger the app opened on.
      ...(ledgerId ? { 'X-Ledger-Id': ledgerId } : {}),

      ...(idempotent ? { 'Idempotency-Key': uuid() } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) throw await failure(response, method, path)

  return (await parse(response)) as T
}

function search(query: RequestOptions['query']): string {
  if (!query) return ''

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value))
  }

  const rendered = params.toString()

  return rendered === '' ? '' : `?${rendered}`
}

async function parse(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined

  const text = await response.text()

  return text === '' ? undefined : JSON.parse(text)
}

/**
 * The server sends its error message already written in Portuguese, so the app
 * shows it as it arrived. A client that turned codes into sentences would have
 * to be redeployed — and on iOS, reviewed — to fix a wording.
 */
async function failure(response: Response, method: string, path: string): Promise<ApiError> {
  const fallback = `${method} ${path} falhou`

  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } }

    return new ApiError(
      response.status,
      body.error?.code ?? 'unknown',
      body.error?.message ?? fallback,
    )
  } catch {
    return new ApiError(response.status, 'unknown', fallback)
  }
}
