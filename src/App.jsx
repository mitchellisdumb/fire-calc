import './App.css'
import FireCalculator from './components/calculator/FIRECalculator'

// Root component simply mounts the calculator shell. Keeping App minimal ensures
// Vite’s fast refresh stays reliable and avoids mixing layout concerns here.
export default function App() {
  return (
    <div>
      <FireCalculator />
    </div>
  )
}
