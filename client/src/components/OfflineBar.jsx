import React, { useState, useEffect } from 'react';

/**
 * OfflineBar — shows a banner whenever the browser loses network.
 */
const OfflineBar = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-bar" role="alert" aria-live="assertive">
      📡 You are offline — some features may be unavailable
    </div>
  );
};

export default OfflineBar;
