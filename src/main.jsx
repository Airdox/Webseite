import { StrictMode } from 'react'
// Build trigger: 2024-12-31-04-12
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import { getLocale } from './utils/i18n.js'
import { maybeLoadAnalytics } from './utils/analyticsLoader.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Load analytics only after consent
maybeLoadAnalytics()

// Keep document language in sync
try {
  document.documentElement.lang = getLocale()
} catch {}

// Service Worker registrieren (für PWA-Funktionalität)
// In dev or when explicitly disabled, unregister to avoid stale caches.
const shouldDisableServiceWorker = import.meta.env.DEV || import.meta.env.VITE_DISABLE_SW === 'true'
if (shouldDisableServiceWorker && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister()
          .then(() => {
            if (import.meta.env.DEV) console.log('SW unregistered successfully')
          })
          .catch(err => {
            if (import.meta.env.DEV) console.warn('SW unregistration failed:', err)
          })
      }
    });
  });
}
