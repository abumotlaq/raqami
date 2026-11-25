import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { NavigationBar } from './components/NavigationBar'
import { Footer } from './components/Footer'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationBar />
        <AppRoutes />
        <Footer />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
