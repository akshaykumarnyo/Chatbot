const BASE = (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_API_URL)
  ?? '/api'

export function getToken(): string | null {
  try {
    const s = localStorage.getItem('auth')
    return s ? JSON.parse(s).accessToken : null
  } catch { return null }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken()
  const resp  = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }))
    throw new Error(err.detail ?? `HTTP ${resp.status}`)
  }
  return resp.json()
}

export const authApi = {
  register: (email: string, full_name: string, password: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, full_name, password }) }),

  login: (email: string, password: string) => {
    const form = new URLSearchParams({ username: email, password })
    return fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    }).then(r => r.ok ? r.json() : r.json().then((e: any) => Promise.reject(new Error(e.detail))))
  },

  me:     () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
}

export const chatApi = {
  getSessions:  ()             => request<any[]>('/chat/sessions'),
  newSession:   ()             => request<{ session_id: string }>('/chat/sessions/new', { method: 'POST' }),
  getMessages:  (sid: string)  => request<any[]>(`/chat/sessions/${sid}/messages`),
  deleteSession:(sid: string)  => request(`/chat/sessions/${sid}`, { method: 'DELETE' }),

  ask: (question: string, session_id: string | null): Promise<Response> => {
    const token = getToken()
    return fetch(`${BASE}/chat/ask`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question, session_id }),
    })
  },
}