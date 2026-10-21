import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthProvider.jsx';
import logger from './utils/logger.js';
import './index.css';

window.addEventListener('error', (event) =>
  logger.error('Uncaught error', { message: event.message, source: event.filename }),
);
window.addEventListener('unhandledrejection', (event) =>
  logger.error('Unhandled promise rejection', { reason: String(event.reason) }),
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

logger.info('Frontend started', { mode: import.meta.env.MODE });
