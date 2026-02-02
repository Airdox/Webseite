import { StrictMode } from 'react'
// Build trigger: 2024-12-31-04-12
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'
import './utils/analyticsV2.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Worker registrieren (für PWA-Funktionalität)
// Emergency: Force unregister Service Worker to clear stale cache
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister()
          .then(() => console.log('SW unregistered successfully'))
          .catch(err => console.log('SW unregistration failed:', err));
      }
    });
  });
}
