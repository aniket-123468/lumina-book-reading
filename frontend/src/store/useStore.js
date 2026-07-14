import { create } from 'zustand';

// ── Theme helpers ─────────────────────────────────────────────
const getInitialTheme = () => localStorage.getItem('theme') || 'light';

const applyTheme = (theme) => {
  const body = window.document.body;
  body.classList.remove('light', 'dark', 'warm-cream');
  body.classList.add(theme);
};

// Apply theme immediately on module load
applyTheme(getInitialTheme());

// ── Auth persistence helpers ──────────────────────────────────
const loadAuth = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const accessToken = localStorage.getItem('accessToken');
    return { user: user || null, accessToken: accessToken || null };
  } catch {
    return { user: null, accessToken: null };
  }
};

const saveAuth = (user, accessToken) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('accessToken', accessToken);
};

const clearAuthStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
};

// ── Store ─────────────────────────────────────────────────────
const { user: storedUser, accessToken: storedToken } = loadAuth();

const useStore = create((set) => ({
  // Theme
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    set({ theme });
  },

  // Auth — persisted in localStorage
  user: storedUser,
  accessToken: storedToken,

  setAuth: (user, accessToken) => {
    saveAuth(user, accessToken);
    set({ user, accessToken });
  },

  clearAuth: () => {
    clearAuthStorage();
    set({ user: null, accessToken: null });
  },
}));

export default useStore;
