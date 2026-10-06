import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
try {
  const savedTheme = localStorage.getItem('mdflow_theme')
  if (savedTheme === 'light') {
    document.documentElement.classList.add('theme-light')
    document.documentElement.classList.remove('theme-dark')
  } else {
    document.documentElement.classList.add('theme-dark')
    document.documentElement.classList.remove('theme-light')
  }
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
