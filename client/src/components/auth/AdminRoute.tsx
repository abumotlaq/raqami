import { Outlet } from 'react-router-dom'
import { Spinner } from '../ui/Spinner'
import { useAuth } from '../../context/AuthContext'

export function AdminRoute() {
  const { status, user } = useAuth()

  if (status !== 'ready') {
    return <Spinner />
  }
  if (user?.role !== 'admin') {
    return <p role="alert">Access denied</p>
  }

  return <Outlet />
}
