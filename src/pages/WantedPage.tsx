import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { isSessionError, useAuth } from '../auth'
import type { Crew, FruitType, SortOption, WantedPage as WantedPageResult, WantedStatus } from '../types'

const statuses: WantedStatus[] = ['AT_LARGE', 'CAPTURED', 'MISSING']
const fruits: FruitType[] = ['PARAMECIA', 'ZOAN', 'LOGIA', 'NONE']
const sorts: SortOption[] = ['bounty,desc', 'name,asc', 'updatedAt,desc']
interface Criteria { page: number; size: 10 | 20 | 50; status?: WantedStatus; crewId?: string; fruit?: FruitType; q?: string; sort: SortOption }
const berries = new Intl.NumberFormat('es-PE')

function criteriaFrom(search: URLSearchParams): Criteria {
  const number = Number(search.get('page')); const rawSize = Number(search.get('size'))
  const status = search.get('status'); const fruit = search.get('fruit'); const sort = search.get('sort')
  return { page: Number.isInteger(number) && number >= 0 ? number : 0, size: rawSize === 10 || rawSize === 50 ? rawSize : 20, status: statuses.includes(status as WantedStatus) ? status as WantedStatus : undefined, crewId: (search.get('crewId') ?? '').trim().slice(0, 200) || undefined, fruit: fruits.includes(fruit as FruitType) ? fruit as FruitType : undefined, q: (search.get('q') ?? '').trim().slice(0, 100) || undefined, sort: sorts.includes(sort as SortOption) ? sort as SortOption : 'bounty,desc' }
}
function criteriaToSearch(criteria: Criteria): URLSearchParams {
  const result = new URLSearchParams()
  if (criteria.page) result.set('page', String(criteria.page)); if (criteria.size !== 20) result.set('size', String(criteria.size))
  if (criteria.status) result.set('status', criteria.status); if (criteria.crewId) result.set('crewId', criteria.crewId); if (criteria.fruit) result.set('fruit', criteria.fruit); if (criteria.q) result.set('q', criteria.q); if (criteria.sort !== 'bounty,desc') result.set('sort', criteria.sort)
  return result
}
function label(value: string): string { return value.replaceAll('_', ' ').toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase()) }

export function WantedPage() {
  const { session, logout } = useAuth(); const [search, setSearch] = useSearchParams()
  const criteria = useMemo(() => criteriaFrom(search), [search])
  const [queryInput, setQueryInput] = useState(criteria.q ?? '')
  const [crews, setCrews] = useState<Crew[]>([]); const [result, setResult] = useState<WantedPageResult | null>(null)
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [reload, setReload] = useState(0)
  useEffect(() => setQueryInput(criteria.q ?? ''), [criteria.q])
  const update = useCallback((changes: Partial<Criteria>, resetPage = true) => setSearch(criteriaToSearch({ ...criteria, ...changes, page: resetPage ? 0 : (changes.page ?? criteria.page) })), [criteria, setSearch])
  useEffect(() => { const timer = window.setTimeout(() => { if (queryInput.trim() !== (criteria.q ?? '')) update({ q: queryInput.trim() || undefined }) }, 350); return () => window.clearTimeout(timer) }, [criteria.q, queryInput, update])
  useEffect(() => {
    if (!session) return; const controller = new AbortController()
    void api.crews(session.token, controller.signal).then(setCrews).catch((reason: unknown) => { if (isSessionError(reason)) logout() })
    return () => controller.abort()
  }, [logout, session])
  useEffect(() => {
    if (!session) return; const controller = new AbortController(); setLoading(true); setError('')
    void api.wanted(session.token, criteriaToSearch(criteria), controller.signal).then((next) => {
      if (next.totalPages > 0 && criteria.page >= next.totalPages) { update({ page: next.totalPages - 1 }, false); return }
      setResult(next)
    }).catch((reason: unknown) => { if (isSessionError(reason)) logout(); else if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los carteles.') }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [criteria, logout, reload, session, update])
  const totalPages = result?.totalPages ?? 0
  return <main className="page"><section className="page-title"><div><p className="eyebrow">East Blue · CP2</p><h1>Carteles de “Se Busca”</h1><p>La URL guarda los filtros, página y orden para que cada rumbo se pueda compartir.</p></div></section><section className="filters content-card"><label className="search">Buscar nombre o epíteto<input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Ej. Ancla Roja" /></label><label>Estado<select value={criteria.status ?? ''} onChange={(event) => update({ status: event.target.value as WantedStatus || undefined })}><option value="">Todos</option>{statuses.map((value) => <option value={value} key={value}>{label(value)}</option>)}</select></label><label>Tripulación<select value={criteria.crewId ?? ''} onChange={(event) => update({ crewId: event.target.value || undefined })}><option value="">Todas</option>{crews.map((crew) => <option value={crew.id} key={crew.id}>{crew.name}</option>)}</select></label><label>Fruta<select value={criteria.fruit ?? ''} onChange={(event) => update({ fruit: event.target.value as FruitType || undefined })}><option value="">Cualquiera</option>{fruits.map((value) => <option value={value} key={value}>{label(value)}</option>)}</select></label><label>Orden<select value={criteria.sort} onChange={(event) => update({ sort: event.target.value as SortOption })}><option value="bounty,desc">Mayor recompensa</option><option value="name,asc">Nombre A-Z</option><option value="updatedAt,desc">Actualizados recientemente</option></select></label><label>Por página<select value={criteria.size} onChange={(event) => update({ size: Number(event.target.value) as 10 | 20 | 50 })}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label></section>
    {error && <div className="notice" role="alert">{error} <button className="text-action" onClick={() => setReload((value) => value + 1)}>Reintentar</button></div>}
    <section className="results" aria-busy={loading}><div className="results-meta"><span>{result ? `${result.totalElements} carteles encontrados` : 'Cargando carteles…'}</span>{loading && <span className="loading-inline">Actualizando…</span>}</div>{!loading && result?.content.length === 0 ? <div className="empty-state"><h2>No hay carteles con estos criterios.</h2><p>Ajusta los filtros o la búsqueda para encontrar otro rumbo.</p></div> : <div className="wanted-grid list-grid">{(result?.content ?? []).map((wanted) => <Link key={wanted.id} className="wanted-card" to={`/wanted/${wanted.id}${search.toString() ? `?from=${encodeURIComponent(search.toString())}` : ''}`}><span className={`status ${wanted.status}`}>{label(wanted.status)}</span><h3>{wanted.name}</h3><p>“{wanted.epithet}”</p><p>{wanted.crew.name} · {wanted.lastSeenIsland}</p><strong>฿ {berries.format(wanted.bounty)}</strong></Link>)}</div>}</section>
    <nav className="pagination" aria-label="Paginación"><button disabled={criteria.page === 0 || loading} onClick={() => update({ page: criteria.page - 1 }, false)}>← Anterior</button><span>Página {totalPages === 0 ? 0 : criteria.page + 1} de {totalPages}</span><button disabled={loading || totalPages === 0 || criteria.page + 1 >= totalPages} onClick={() => update({ page: criteria.page + 1 }, false)}>Siguiente →</button></nav>
  </main>
}
