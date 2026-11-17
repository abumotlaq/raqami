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
import type { Cart } from '../types/api'
import { useAuth } from './AuthContext'

type CartStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CartState {
  cart: Cart | null
  status: CartStatus
  error: string | null
}

type CartAction =
  | { type: 'loading' }
  | { type: 'loaded'; cart: Cart }
  | { type: 'failed'; error: string }
  | { type: 'reset' }

interface CartContextValue {
  state: CartState
  refreshCart: () => Promise<void>
  addItem: (productId: string) => Promise<void>
  removeItem: (productId: string) => Promise<void>
}

const initialState: CartState = {
  cart: null,
  status: 'idle',
  error: null,
}

function cartReducer(_state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'loading':
      return { cart: null, status: 'loading', error: null }
    case 'loaded':
      return { cart: action.cart, status: 'ready', error: null }
    case 'failed':
      return { cart: null, status: 'error', error: action.error }
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
      const cart = await getCart(token)
      dispatch({ type: 'loaded', cart })
    } catch (error) {
      dispatch({ type: 'failed', error: getErrorMessage(error) })
      throw error
    }
  }, [token])

  const addItem = useCallback(
    async (productId: string) => {
      dispatch({ type: 'loading' })
      try {
        await addCartItemRequest({ productId }, token)
        await refreshCart()
      } catch (error) {
        dispatch({ type: 'failed', error: getErrorMessage(error) })
        throw error
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
        throw error
      }
    },
    [refreshCart, token],
  )

  useEffect(() => {
    if (authStatus === 'ready' && token) {
      void refreshCart().catch(() => undefined)
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
