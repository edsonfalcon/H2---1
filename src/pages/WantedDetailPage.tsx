import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api } from '../api'
import { isSessionError, useAuth } from '../auth'
import type { WantedDetail } from '../types'

const berries = new Intl.NumberFormat('es-PE')
export function WantedDetailPage() {
  const { id = '' } = useParams(); const location = useLocation(); const { session, logout } = useAuth()
  const [wanted, setWanted] = useState<WantedDetail | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0)
  const from = new URLSearchParams(location.search).get('from'); const returnTo = `/wanted${from ? `?${from}` : ''}`
  const load = useCallback(() => {
    if (!session || !id) return; const controller = new AbortController(); setLoading(true); setError('')
    void api.wantedDetail(session.token, id, controller.signal).then(setWanted).catch((reason: unknown) => { if (isSessionError(reason)) logout(); else if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el cartel.') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [id, logout, session])
  useEffect(() => load(), [load, retry])
  if (loading && !wanted) return <main className="page centered"><div className="spinner" /><p>Abriendo el cartel…</p></main>
  if (error && !wanted) return <main className="page centered"><p className="form-error">{error}</p><button className="button" onClick={() => setRetry((value) => value + 1)}>Reintentar</button><Link to={returnTo}>Volver al listado</Link></main>
  if (!wanted) return null
  return <main className="page detail"><Link className="back-link" to={returnTo}>← Volver a carteles</Link><section className="detail-hero"><p className="eyebrow">Expediente {wanted.id}</p><span className={`status ${wanted.status}`}>{wanted.status.replace('_', ' ')}</span><h1>{wanted.name}</h1><p className="epithet">“{wanted.epithet}”</p><strong>฿ {berries.format(wanted.bounty)}</strong></section><section className="detail-grid"><article className="content-card"><h2>Perfil</h2><p>{wanted.bio}</p><dl><div><dt>Tripulación</dt><dd>{wanted.crew.name}</dd></div><div><dt>Rol</dt><dd>{wanted.role}</dd></div><div><dt>Fruta</dt><dd>{wanted.devilFruit ? `${wanted.devilFruit.name} (${wanted.devilFruit.type})` : 'Sin fruta del diablo'}</dd></div><div><dt>Último avistamiento</dt><dd>{wanted.lastSeen.island} · {new Date(wanted.lastSeen.seenAt).toLocaleDateString('es-PE')}</dd></div><div><dt>Edad / altura</dt><dd>{wanted.age} años · {wanted.heightCm} cm</dd></div></dl></article><article className="content-card"><h2>Historial de recompensa</h2><ol className="history">{wanted.bountyHistory.map((entry) => <li key={entry.issuedAt}><span>{new Date(entry.issuedAt).toLocaleDateString('es-PE')}</span><strong>฿ {berries.format(entry.amount)}</strong></li>)}</ol></article></section></main>
}
