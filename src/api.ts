import type { ApiErrorBody, Crew, DashboardSummary, LogPose, MeResponse, Session, WantedDetail, WantedPage } from './types'

const baseUrl = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Array<{ field: string; message: string }>

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.status = body.status
    this.code = body.code
    this.details = body.details ?? []
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.status === 'number' && typeof candidate.code === 'string' && typeof candidate.message === 'string' && typeof candidate.traceId === 'string'
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!baseUrl) throw new Error('Falta configurar VITE_API_BASE_URL.')
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers })
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const body: ApiErrorBody = isApiErrorBody(data)
      ? data
      : { status: response.status, code: 'REQUEST_FAILED', message: 'No se pudo completar la solicitud.', traceId: '' }
    throw new ApiError(body)
  }
  return data as T
}

export const api = {
  login: (email: string, password: string) => request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (teamName: string, email: string, password: string) => request<Session>('/auth/register', { method: 'POST', body: JSON.stringify({ teamName, email, password }) }),
  me: (token: string, signal?: AbortSignal) => request<MeResponse>('/auth/me', { signal }, token),
  dashboard: (token: string, signal?: AbortSignal) => request<DashboardSummary>('/dashboard/summary', { signal }, token),
  logPose: (token: string, signal?: AbortSignal) => request<LogPose>('/log-pose', { signal }, token),
  crews: (token: string, signal?: AbortSignal) => request<Crew[]>('/crews', { signal }, token),
  wanted: (token: string, query: URLSearchParams, signal?: AbortSignal) => request<WantedPage>(`/wanted?${query.toString()}`, { signal }, token),
  wantedDetail: (token: string, id: string, signal?: AbortSignal) => request<WantedDetail>(`/wanted/${encodeURIComponent(id)}`, { signal }, token),
}
