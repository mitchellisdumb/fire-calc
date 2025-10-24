import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Standard Vite entry point. Rendering inside StrictMode helps surface effect
// issues during development; production builds automatically drop the double render.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
