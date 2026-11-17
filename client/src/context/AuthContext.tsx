import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ApiResponseError,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  setUnauthenticatedHandler,
} from '../services/api'
import type {
  AuthResponse,
  LoginRequestBody,
  RegisterRequestBody,
  User,
} from '../types/api'

const TOKEN_STORAGE_KEY = 'raqami_token'

type AuthStatus = 'idle' | 'loading' | 'ready'

interface AuthState {
  user: User | null
  token: string | null
  status: AuthStatus
}

type AuthAction =
  | { type: 'startup-loading'; token: string }
  | { type: 'startup-anonymous' }
  | { type: 'authenticated'; user: User; token: string }
  | { type: 'startup-failed'; token: string }
  | { type: 'login-started' }
  | { type: 'anonymous' }

interface AuthContextValue extends AuthState {
  login: (body: LoginRequestBody) => Promise<void>
  register: (body: RegisterRequestBody) => Promise<void>
  logout: () => Promise<void>
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'startup-loading':
      return { user: null, token: action.token, status: 'loading' }
    case 'startup-anonymous':
    case 'anonymous':
      return { user: null, token: null, status: 'ready' }
    case 'authenticated':
      return { user: action.user, token: action.token, status: 'ready' }
    case 'startup-failed':
      return { user: null, token: action.token, status: 'ready' }
    case 'login-started':
      return { ...state, status: 'loading' }
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(
    () =>
      setUnauthenticatedHandler(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY)
        dispatch({ type: 'anonymous' })
        const from = `${location.pathname}${location.search}${location.hash}`
        navigate('/login', {
          replace: true,
          state: {
            from:
              location.pathname === '/login' || location.pathname === '/register'
                ? '/'
                : from,
          },
        })
      }),
    [location.hash, location.pathname, location.search, navigate],
  )

  useEffect(() => {
    let active = true
    let storedToken: string | null

    try {
      storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    } catch {
      if (active) dispatch({ type: 'startup-anonymous' })
      return () => {
        active = false
      }
    }

    if (!storedToken) {
      dispatch({ type: 'startup-anonymous' })
      return () => {
        active = false
      }
    }

    dispatch({ type: 'startup-loading', token: storedToken })
    void getCurrentUser(storedToken)
      .then((user) => {
        if (active) {
          dispatch({ type: 'authenticated', user, token: storedToken })
        }
      })
      .catch((error: unknown) => {
        if (!active) return

        if (
          error instanceof ApiResponseError &&
          error.status === 401 &&
          error.code === 'UNAUTHENTICATED'
        ) {
          try {
            window.localStorage.removeItem(TOKEN_STORAGE_KEY)
          } finally {
            dispatch({ type: 'startup-anonymous' })
          }
          return
        }

        dispatch({ type: 'startup-failed', token: storedToken })
      })

    return () => {
      active = false
    }
  }, [])

  const authenticate = useCallback(
    async (requestAuth: () => Promise<AuthResponse>) => {
      dispatch({ type: 'login-started' })
      try {
        const response = await requestAuth()
        window.localStorage.setItem(TOKEN_STORAGE_KEY, response.token)
        dispatch({
          type: 'authenticated',
          user: response.user,
          token: response.token,
        })
      } catch (error) {
        dispatch({ type: 'anonymous' })
        throw error
      }
    },
    [],
  )

  const login = useCallback(
    (body: LoginRequestBody) => authenticate(() => loginRequest(body)),
    [authenticate],
  )

  const register = useCallback(
    (body: RegisterRequestBody) => authenticate(() => registerRequest(body)),
    [authenticate],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest(state.token)
    } finally {
      try {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      } finally {
        dispatch({ type: 'anonymous' })
      }
    }
  }, [state.token])

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }
  return context
}
