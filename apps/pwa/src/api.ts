const API_URL = import.meta.env.VITE_API_URL as string

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface Me {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
}

/**
 * Takes `getToken` rather than a token string. The token is short-lived, so a
 * value read at render time may already be stale by the time a request goes
 * out; asking for it at call time lets the SDK renew first.
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
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, `${init.method ?? 'GET'} ${path} failed`)
  }

  return response.json() as Promise<T>
}

export function fetchMe(getToken: () => Promise<string | null>): Promise<Me> {
  return apiFetch<Me>('/api/v1/me', getToken)
}
