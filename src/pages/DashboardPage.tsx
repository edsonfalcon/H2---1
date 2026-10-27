import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { isSessionError, useAuth } from '../auth'
import type { DashboardSummary, LogPose } from '../types'

const berries = new Intl.NumberFormat('es-PE')
export function DashboardPage() {
  const { session, logout } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [logPose, setLogPose] = useState<LogPose | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => {
    if (!session) return
    const controller = new AbortController(); setLoading(true); setError('')
    void Promise.all([api.dashboard(session.token, controller.signal), api.logPose(session.token, controller.signal)])
      .then(([nextSummary, nextLogPose]) => { setSummary(nextSummary); setLogPose(nextLogPose) })
      .catch((reason: unknown) => { if (isSessionError(reason)) logout(); else if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError(reason instanceof Error ? reason.message : 'No se pudo cargar la consola.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [logout, session])
  useEffect(() => load(), [load])
  if (loading && !summary) return <main className="page centered"><div className="spinner" /><p>Cargando los indicadores de la Guild…</p></main>
  if (error && !summary) return <main className="page centered"><p className="form-error">{error}</p><button className="button" onClick={load}>Reintentar</button></main>
  if (!summary || !logPose) return null
  if (summary.wanted.total === 0) return <main className="page centered"><p className="eyebrow">Workspace vacío · Log Pose {logPose.status}</p><h1>Aún no hay carteles registrados.</h1><p>{logPose.message}</p><p>Cuando la Guild publique información, aparecerá aquí.</p><Link className="button" to="/wanted">Ver carteles</Link></main>
  return <main className="page"><section className="page-title"><div><p className="eyebrow">{summary.team.code}</p><h1>Consola de {summary.team.name}</h1><p>Datos generados por la Guild en tiempo real.</p></div><aside className={`log-pose ${logPose.grandLineUnlocked ? 'unlocked' : ''}`}><span>Log Pose · {logPose.status}</span><strong>{logPose.message}</strong></aside></section>{error && <div className="notice">{error} <button className="text-action" onClick={load}>Reintentar</button></div>}
    <section className="metrics"><article><span>Carteles activos</span><strong>{summary.wanted.total}</strong></article><article><span>Recompensa total</span><strong>฿ {berries.format(summary.wanted.totalBounty)}</strong></article><article><span>Tripulaciones</span><strong>{summary.crews.total}</strong></article><article><span>Promedio</span><strong>฿ {berries.format(summary.wanted.averageBounty)}</strong></article></section>
    <section className="content-card"><div className="section-heading"><div><p className="eyebrow">Máxima prioridad</p><h2>Carteles con mayor recompensa</h2></div><Link to="/wanted">Explorar todos →</Link></div><div className="wanted-grid">{summary.topBounties.map((wanted) => <Link className="wanted-card" to={`/wanted/${wanted.id}`} key={wanted.id}><span className={`status ${wanted.status}`}>{wanted.status.replace('_', ' ')}</span><h3>{wanted.name}</h3><p>“{wanted.epithet}” · {wanted.crew.name}</p><strong>฿ {berries.format(wanted.bounty)}</strong></Link>)}</div></section>
  </main>
}
