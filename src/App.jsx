import './App.css'
import FireCalculator from './components/calculator/FIRECalculator'
import ErrorBoundary from './components/ErrorBoundary'

// Root component wraps the calculator in an error boundary to catch and display
// errors gracefully without the white screen of death. Keeping App minimal ensures
// Vite's fast refresh stays reliable and avoids mixing layout concerns here.
export default function App() {
  return (
    <ErrorBoundary>
      <div>
        <FireCalculator />
      </div>
    </ErrorBoundary>
  )
}
