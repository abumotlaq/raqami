import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../services/api'
import { ErrorState } from './ui/ErrorState'

export function NavigationBar() {
  const { user, status, logout } = useAuth()
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function handleLogout() {
    setLogoutError(null)
    try {
      await logout()
    } catch (error: unknown) {
      setLogoutError(getErrorMessage(error))
    }
  }

  return (
    <header className="space-y-sm border-b border-border bg-surface p-md">
      <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-md">
        <Link className="text-subheading" to="/">
          Raqami
        </Link>
        {user ? (
          <>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/library">Library</Link>
            {user.role === 'admin' ? (
              <>
                <Link to="/admin/products">Admin products</Link>
                <Link to="/admin/orders">Admin orders</Link>
              </>
            ) : null}
            <button
              className="rounded-control border border-border px-md py-sm"
              type="button"
              disabled={status !== 'ready'}
              onClick={() => void handleLogout()}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      {logoutError ? <ErrorState message={logoutError} /> : null}
    </header>
  )
}
