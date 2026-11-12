export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_ALREADY_IN_CART'
  | 'CART_EMPTY'
  | 'PAYMENT_FAILED'
  | 'PRODUCT_NOT_PURCHASED'
  | 'ADMIN_ONLY'

export interface ApiError {
  code: ApiErrorCode
  message: string
}

export type UserRole = 'customer' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthResponse {
  user: User
  token: string
}

// Prices are decimal strings such as "9.00".
export type Price = string

export interface Product {
  id: string
  title: string
  category: string
  price: Price
  description: string
  imageUrl: string
  maxQuantity: 1
  isActive: boolean
}

export type OrderStatus = 'pending' | 'paid' | 'failed'

export interface OrderItem {
  productId: string
  title: string
  unitPrice: Price
}

export interface Order {
  id: string
  status: OrderStatus
  total: Price
  // ISO 8601 timestamp.
  createdAt: string
  items: OrderItem[]
}

export interface DownloadLink {
  url: string
  expiresAt: string
}

export interface PaginationMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}
