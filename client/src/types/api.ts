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
  | 'UNAUTHENTICATED'
  | 'PRODUCT_ALREADY_PURCHASED'
  | 'ORDER_NOT_FOUND'
  | 'FILE_NOT_AVAILABLE'
  | 'DOWNLOAD_LINK_INVALID'
  | 'NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR'

export type FieldErrors = Record<string, string[]>

export interface ApiError {
  code: ApiErrorCode
  message: string
  errors: FieldErrors | null
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

export interface RegisterRequestBody {
  name: string
  email: string
  password: string
}

export interface LoginRequestBody {
  email: string
  password: string
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

export interface AdminProduct extends Product {
  hasFile: boolean
}

export interface CartItem {
  product: Product
  quantity: 1
}

export interface Cart {
  items: CartItem[]
  total: Price
}

export interface AddCartItemRequestBody {
  productId: string
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
  createdAt: string
  items: OrderItem[]
}

export interface AdminOrder extends Order {
  user: Pick<User, 'id' | 'name' | 'email'>
}

export interface LibraryItem {
  product: Product
  purchasedAt: string
}

export interface LibraryResponse {
  data: LibraryItem[]
}

export interface DownloadLink {
  url: string
  expiresAt: string
}

export interface PaginationQuery {
  page?: number
  per_page?: number
}

export interface ProductsQuery extends PaginationQuery {
  search?: string
  category?: string
}

export interface AdminProductCreateRequestBody {
  title: string
  category: string
  price: Price
  description: string
  imageUrl: string
  isActive?: boolean
}

export type AdminProductPatchRequestBody =
  Partial<AdminProductCreateRequestBody>

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
