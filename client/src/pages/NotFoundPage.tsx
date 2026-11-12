import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The requested page could not be found.</p>
      <Link to="/">Return to home</Link>
    </main>
  )
}
