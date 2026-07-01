import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { UIFeedbackProvider } from './contexts/UIFeedbackContext'
import './styles/index.css'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Error registrando Service Worker:', error)
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UIFeedbackProvider>
      <App />
    </UIFeedbackProvider>
  </React.StrictMode>,
)
