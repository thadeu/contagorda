/**
 * The HTTP transport the real services will sit on. Nothing uses it yet — the
 * screens run against the mock — but it is here so the eventual swap is
 * implementing the ports, not inventing a client at the same time.
 */
const API_URL = import.meta.env.VITE_API_URL as string

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Takes `getToken` rather than a token. Access tokens are short-lived, so a
 * value read at render time can be stale by the time the request goes out;
 * asking at call time lets the SDK renew first.
 */
export async function apiFetch<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init: RequestInit = {},
): Promise<T> {
  const token = await getToken()

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, `${init.method ?? 'GET'} ${path} failed`)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}
