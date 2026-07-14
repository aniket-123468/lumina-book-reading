import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Library from './pages/Library';
import Reader from './pages/Reader';
import Highlights from './pages/Highlights';
import { apiFetch } from './utils/api';

import ThreeJsBackground from './components/ThreeJsBackground';

// Full-screen loading spinner
const SplashLoader = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
    <ThreeJsBackground />
    <div className="relative z-10 flex flex-col items-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
      <p className="text-primary font-label-sm tracking-widest uppercase text-xs animate-pulse">Loading Lexicon...</p>
    </div>
  </div>
);

const App = () => {
  const { theme, user, accessToken, setAuth, clearAuth } = useStore();
  const isAuthenticated = !!user && !!accessToken;
  const [isInitializing, setIsInitializing] = useState(true);

  // Apply theme class to body whenever theme changes
  useEffect(() => {
    const body = window.document.body;
    body.classList.remove('light', 'dark', 'warm-cream');
    body.classList.add(theme);
  }, [theme]);

  // On mount: if we have stored credentials, verify them against the server.
  // If invalid, try refresh cookie. If that fails too, clear auth.
  useEffect(() => {
    const verifyAuth = async () => {
      if (!user || !accessToken) {
        // No stored credentials — try refreshing via HttpOnly cookie
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            // Get user info with the new token
            const meRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${data.accessToken}` },
              credentials: 'include',
            });
            if (meRes.ok) {
              const userData = await meRes.json();
              setAuth(userData, data.accessToken);
            }
          }
        } catch {
          // Refresh failed — user needs to login
        }
        setIsInitializing(false);
        return;
      }

      // We have stored credentials — verify they still work
      try {
        const res = await apiFetch('/auth/me');
        if (!res.ok) {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
      setIsInitializing(false);
    };

    verifyAuth();
  }, []); // Run once on mount

  if (isInitializing) {
    return (
      <div className={theme}>
        <SplashLoader />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-on-background">
        <Routes>
          {/* Root → redirect to library (or login if unauthenticated) */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? '/library' : '/login'} replace />}
          />

          {/* Public Routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/library" replace /> : <Login />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/library" replace /> : <Signup />}
          />

          {/* Protected Routes */}
          <Route
            path="/library"
            element={isAuthenticated ? <Library /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/read/:id"
            element={isAuthenticated ? <Reader /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/highlights"
            element={isAuthenticated ? <Highlights /> : <Navigate to="/login" replace />}
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
