import React from 'react';
import { createRoot } from 'react-dom/client';
import DesktopApp from './DesktopApp.jsx';

createRoot(document.getElementById('desktop-root')).render(
  <React.StrictMode>
    <DesktopApp />
  </React.StrictMode>,
);
