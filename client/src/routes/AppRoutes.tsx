import { Route, Routes } from 'react-router-dom'
import { AdminRoute } from '../components/auth/AdminRoute'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AdminOrdersPage } from '../pages/AdminOrdersPage'
import { AdminProductsPage } from '../pages/AdminProductsPage'
import { CartPage } from '../pages/CartPage'
import { CheckoutResultPage } from '../pages/CheckoutResultPage'
import { HomePage } from '../pages/HomePage'
import { LibraryPage } from '../pages/LibraryPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OrdersPage } from '../pages/OrdersPage'
import { ProductDetailsPage } from '../pages/ProductDetailsPage'
import { RegisterPage } from '../pages/RegisterPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products/:id" element={<ProductDetailsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout/result/:orderId"
          element={<CheckoutResultPage />}
        />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/library" element={<LibraryPage />} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
