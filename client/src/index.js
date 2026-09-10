import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA support
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // New version available — optionally prompt user to reload
    const shouldReload = window.confirm(
      'A new version of Hamsaad Lubricants is available. Reload to update?'
    );
    if (shouldReload && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
  onSuccess: () => {
    console.log('[PWA] App cached for offline use.');
  },
});
