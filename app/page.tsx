'use client';

import { useState, useEffect } from 'react';
import TravelDashboard from '@/components/TravelDashboard';
import Login from '@/components/Login';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simple session persistence for the demo
  useEffect(() => {
    const auth = sessionStorage.getItem('filosofia_auth');
    if (auth === 'true') {
      setIsAuthenticated(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('filosofia_auth', 'true');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <main className="min-h-screen py-12">
      <TravelDashboard />
    </main>
  );
}
