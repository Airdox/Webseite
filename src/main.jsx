import { StrictMode } from 'react'
// Build trigger: 2024-12-31-04-12
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import { getLocale } from './utils/i18n.js'
import { maybeLoadAnalytics } from './utils/analyticsLoader.js'
import { statsSync } from './utils/stats-sync.js'

import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Load analytics only after consent
maybeLoadAnalytics()

// Keep document language in sync
try {
  document.documentElement.lang = getLocale()
} catch {
  // no-op
}

// Always unregister stale service workers to avoid serving old cached assets.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    });
  });
}
