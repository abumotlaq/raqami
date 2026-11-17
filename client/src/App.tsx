import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { NavigationBar } from './components/NavigationBar'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationBar />
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
