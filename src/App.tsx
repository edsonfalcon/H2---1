import type { ReactNode } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { WantedDetailPage } from './pages/WantedDetailPage'
import { WantedPage } from './pages/WantedPage'

function PendingSession() { return <main className="centered"><div className="spinner" /><p>Restaurando la sesión…</p></main> }

function PrivateRoute({ children }: { children: ReactNode }) {
  const { session, restoring } = useAuth()
  const location = useLocation()
  if (restoring) return <PendingSession />
  if (!session) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  return children
}

function Shell({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth()
  return <div className="app-shell">
    <header className="topbar"><NavLink className="brand" to="/dashboard">LOG <span>POSE</span></NavLink><nav><NavLink to="/dashboard">Consola</NavLink><NavLink to="/wanted">Se busca</NavLink></nav><div className="account"><span>{session?.team.name}</span><button className="link-button" onClick={logout}>Salir</button></div></header>
    {children}
  </div>
}

function NotFound() { return <main className="centered"><p className="eyebrow">Error 404</p><h1>Este rumbo no existe.</h1><NavLink className="button" to="/dashboard">Volver a la consola</NavLink></main> }

export function App() {
  return <Routes>
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/dashboard" element={<PrivateRoute><Shell><DashboardPage /></Shell></PrivateRoute>} />
    <Route path="/wanted" element={<PrivateRoute><Shell><WantedPage /></Shell></PrivateRoute>} />
    <Route path="/wanted/:id" element={<PrivateRoute><Shell><WantedDetailPage /></Shell></PrivateRoute>} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
}
