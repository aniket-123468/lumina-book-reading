import useStore from '../store/useStore';

const API_URL = import.meta.env.VITE_API_URL;

export const apiFetch = async (endpoint, options = {}) => {
  const { accessToken, setAuth, clearAuth } = useStore.getState();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Remove Content-Type if we're sending FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
    // Try to refresh token
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshResponse.ok) {
        const { accessToken: newAccessToken } = await refreshResponse.json();
        setAuth(useStore.getState().user, newAccessToken);
        
        // Retry original request
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        clearAuth();
      }
    } catch (err) {
      clearAuth();
    }
  }

  return response;
};
