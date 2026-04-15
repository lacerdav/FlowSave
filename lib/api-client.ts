export function normalizeApiError(
  payload: unknown,
  fallback = 'Something went wrong.'
): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const candidate = payload as { error?: unknown; message?: unknown }

    if (typeof candidate.error === 'string' && candidate.error.trim()) {
      return candidate.error
    }

    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      return candidate.message
    }
  }

  return fallback
}

export async function apiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackError?: string
): Promise<T> {
  const response = await fetch(input, init)
  const contentType = response.headers.get('content-type') ?? ''

  let payload: unknown = null

  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null)
  } else {
    payload = await response.text().catch(() => null)
  }

  if (!response.ok) {
    throw new Error(normalizeApiError(payload, fallbackError))
  }

  return payload as T
}
