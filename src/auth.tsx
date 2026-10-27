import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from './api'
import type { Session } from './types'

const storageKey = 'log-pose-session'
interface AuthValue {
  session: Session | null
  restoring: boolean
  authenticate: (kind: 'login' | 'register', values: { email: string; password: string; teamName?: string }) => Promise<void>
  logout: () => void
}
const AuthContext = createContext<AuthValue | null>(null)

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const saved: unknown = JSON.parse(raw)
    if (typeof saved !== 'object' || saved === null || typeof (saved as Record<string, unknown>).token !== 'string') return null
    return saved as Session
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [restoring, setRestoring] = useState(true)

  const logout = useCallback(() => { localStorage.removeItem(storageKey); setSession(null) }, [])

  useEffect(() => {
    const saved = readSession()
    if (!saved) { setRestoring(false); return }
    const controller = new AbortController()
    void api.me(saved.token, controller.signal)
      .then((me) => setSession({ ...saved, ...me }))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === 'AbortError')) logout() })
      .finally(() => { if (!controller.signal.aborted) setRestoring(false) })
    return () => controller.abort()
  }, [logout])

  const authenticate = useCallback(async (kind: 'login' | 'register', values: { email: string; password: string; teamName?: string }) => {
    const next = kind === 'login'
      ? await api.login(values.email, values.password)
      : await api.register(values.teamName ?? '', values.email, values.password)
    localStorage.setItem(storageKey, JSON.stringify(next))
    setSession(next)
  }, [])

  const value = useMemo(() => ({ session, restoring, authenticate, logout }), [session, restoring, authenticate, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return context
}

export function isSessionError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}
