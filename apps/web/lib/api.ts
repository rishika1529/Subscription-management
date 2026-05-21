// ── Centralised API client ──────────────────────────────────────────────────
// All requests go through here so the base URL and auth header are always correct.

// In production this is set to your Render backend URL via NEXT_PUBLIC_API_URL
export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function saveToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem('token', token);
}

export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem('token');
}

async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });

  // Try to parse body regardless of status so we can surface the message
  let body: any = null;
  try { body = await res.json(); } catch {}

  if (!res.ok) {
    const msg =
      (Array.isArray(body?.message) ? body.message.join(', ') : body?.message) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return body as T;
}

export const api = {
  get:    <T = any>(path: string)              => apiFetch<T>(path),
  post:   <T = any>(path: string, body: any)   => apiFetch<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T = any>(path: string, body: any)   => apiFetch<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T = any>(path: string)              => apiFetch<T>(path, { method: 'DELETE' }),
};
