import React, { useState, useEffect } from 'react';

/**
 * PWAInstallBanner
 * Shows a native-style install prompt for Android (Chrome) and
 * a manual instructions prompt for iOS (Safari).
 */
const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner]         = useState(false);
  const [isIOS, setIsIOS]                   = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator.standalone);
    setIsIOS(ios);

    // Listen for Chrome's beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show iOS banner after a 2s delay (only once per session)
    if (ios && !sessionStorage.getItem('pwa-ios-dismissed')) {
      const t = setTimeout(() => setShowBanner(true), 2000);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-ios-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="pwa-install-banner" role="alert" aria-live="polite">
      <div style={{ fontSize: '22px', flexShrink: 0 }}>📱</div>
      <div className="pwa-install-banner__text">
        <strong>Install Hamsaad Lubricants</strong>
        <br />
        {isIOS
          ? 'Tap ⎙ Share → "Add to Home Screen" to install.'
          : 'Add to your home screen for quick access — works offline too.'}
      </div>
      <div className="pwa-install-banner__actions">
        {!isIOS && (
          <button
            onClick={handleInstall}
            style={{
              background: '#fff',
              color: '#1F3864',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {isIOS ? 'Got it' : 'Not now'}
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
