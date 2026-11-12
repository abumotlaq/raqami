import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '../ui/Spinner'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute() {
  const { status, user } = useAuth()
  const location = useLocation()
  const requestedPath = `${location.pathname}${location.search}${location.hash}`

  if (status !== 'ready') {
    return <Spinner />
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: requestedPath }}
        replace
      />
    )
  }

  return <Outlet />
}
