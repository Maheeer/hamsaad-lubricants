import React, { useState, useEffect } from 'react';
import ClientLogin from './ClientLogin';
import ClientPortal from './ClientPortal';

export default function ClientApp() {
  const [client, setClient] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('hamsaad_client');
    const token  = localStorage.getItem('hamsaad_client_token');
    if (stored && token) {
      setClient(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (clientData) => {
    setClient(clientData);
  };

  const handleLogout = () => {
    localStorage.removeItem('hamsaad_client_token');
    localStorage.removeItem('hamsaad_client');
    setClient(null);
  };

  if (!client) return <ClientLogin onLogin={handleLogin} />;
  return <ClientPortal client={client} onLogout={handleLogout} />;
}
