import { FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../auth'

type FieldErrors = Partial<Record<'teamName' | 'email' | 'password', string>>
function errorsFrom(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) return {}
  if (error.code === 'EMAIL_ALREADY_REGISTERED') return { email: error.message }
  if (error.code === 'TEAM_NAME_TAKEN') return { teamName: error.message }
  return error.details.reduce<FieldErrors>((result, detail) => ({ ...result, [detail.field]: detail.message }), {})
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { session, restoring, authenticate } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [teamName, setTeamName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const requested = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  if (restoring) return <main className="centered"><div className="spinner" /><p>Verificando sesión…</p></main>
  if (session) return <Navigate to={requested} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setErrors({}); setMessage('')
    try { await authenticate(mode, { teamName, email, password }); navigate(requested, { replace: true }) }
    catch (error: unknown) {
      setErrors(errorsFrom(error))
      setMessage(error instanceof Error ? error.message : 'No se pudo conectar con el servidor.')
    } finally { setSubmitting(false) }
  }
  const registration = mode === 'register'
  return <main className="auth-layout"><section className="auth-copy"><p className="eyebrow">East Blue · CP1</p><h1>Encuentra el rumbo correcto.</h1><p>La consola de la Guild para rastrear carteles y preparar tu tripulación para Reverse Mountain.</p></section><section className="auth-card"><p className="eyebrow">{registration ? 'Nueva tripulación' : 'Tripulación registrada'}</p><h2>{registration ? 'Registra tu equipo' : 'Inicia sesión'}</h2><form onSubmit={submit} noValidate>
    {registration && <label>Nombre del equipo<input value={teamName} onChange={(event) => setTeamName(event.target.value)} aria-invalid={Boolean(errors.teamName)} required minLength={3} maxLength={40} />{errors.teamName && <small className="field-error">{errors.teamName}</small>}</label>}
    <label>Correo<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} required />{errors.email && <small className="field-error">{errors.email}</small>}</label>
    <label>Contraseña<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={registration ? 'new-password' : 'current-password'} aria-invalid={Boolean(errors.password)} required minLength={registration ? 8 : 1} />{errors.password && <small className="field-error">{errors.password}</small>}</label>
    {message && <p className="form-error" role="alert">{message}</p>}<button className="button" disabled={submitting}>{submitting ? 'Conectando…' : registration ? 'Registrar y entrar' : 'Entrar a la consola'}</button>
  </form><p className="auth-switch">{registration ? '¿Ya tienen cuenta?' : '¿Primera vez?'} <Link to={registration ? '/login' : '/register'}>{registration ? 'Inicien sesión' : 'Registren el equipo'}</Link></p></section></main>
}
