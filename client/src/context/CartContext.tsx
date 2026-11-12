import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import {
  addCartItem as addCartItemRequest,
  getCart,
  getErrorMessage,
  removeCartItem as removeCartItemRequest,
} from '../services/api'
import { useAuth } from './AuthContext'

type CartStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CartState {
  response: unknown | null
  status: CartStatus
  error: string | null
}

type CartAction =
  | { type: 'loading' }
  | { type: 'loaded'; response: unknown }
  | { type: 'failed'; error: string }
  | { type: 'reset' }

interface CartContextValue {
  state: CartState
  refreshCart: () => Promise<void>
  addItem: (productId: string) => Promise<void>
  removeItem: (productId: string) => Promise<void>
}

const initialState: CartState = {
  response: null,
  status: 'idle',
  error: null,
}

function cartReducer(_state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'loading':
      return { response: null, status: 'loading', error: null }
    case 'loaded':
      return { response: action.response, status: 'ready', error: null }
    case 'failed':
      return { response: null, status: 'error', error: action.error }
    case 'reset':
      return initialState
  }
}

const CartContext = createContext<CartContextValue | null>(null)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const { status: authStatus, token } = useAuth()
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const refreshCart = useCallback(async () => {
    dispatch({ type: 'loading' })
    try {
      const response = await getCart(token)
      dispatch({ type: 'loaded', response })
    } catch (error) {
      dispatch({ type: 'failed', error: getErrorMessage(error) })
    }
  }, [token])

  const addItem = useCallback(
    async (productId: string) => {
      dispatch({ type: 'loading' })
      try {
        await addCartItemRequest(productId, token)
        await refreshCart()
      } catch (error) {
        dispatch({ type: 'failed', error: getErrorMessage(error) })
      }
    },
    [refreshCart, token],
  )

  const removeItem = useCallback(
    async (productId: string) => {
      dispatch({ type: 'loading' })
      try {
        await removeCartItemRequest(productId, token)
        await refreshCart()
      } catch (error) {
        dispatch({ type: 'failed', error: getErrorMessage(error) })
      }
    },
    [refreshCart, token],
  )

  useEffect(() => {
    if (authStatus === 'ready' && token) {
      void refreshCart()
    } else if (authStatus === 'ready') {
      dispatch({ type: 'reset' })
    }
  }, [authStatus, refreshCart, token])

  return (
    <CartContext.Provider value={{ state, refreshCart, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider.')
  }
  return context
}
