import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';
import { apiFetch } from '../utils/api';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useStore(state => state.user);
  const clearAuth = useStore(state => state.clearAuth);

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error(error);
    }
    clearAuth();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/library' && location.pathname === '/library') return true;
    if (path === '/highlights' && location.pathname.startsWith('/highlights')) return true;
    if (path === '/read' && location.pathname.startsWith('/read')) return true;
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-highest border-t border-outline-variant/30 flex justify-around items-center z-50 px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      
      <button 
        onClick={() => navigate('/library')} 
        className={`flex flex-col items-center justify-center w-16 h-full ${isActive('/library') ? 'text-primary' : 'text-on-surface-variant'}`}
      >
        <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: isActive('/library') ? "'FILL' 1" : "'FILL' 0"}}>library_books</span>
        <span className="font-label-sm text-[10px] mt-1">Library</span>
      </button>

      <button 
        onClick={() => navigate('/highlights')} 
        className={`flex flex-col items-center justify-center w-16 h-full ${isActive('/highlights') ? 'text-primary' : 'text-on-surface-variant'}`}
      >
        <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: isActive('/highlights') ? "'FILL' 1" : "'FILL' 0"}}>edit_note</span>
        <span className="font-label-sm text-[10px] mt-1">Notes</span>
      </button>

      {location.pathname.startsWith('/read') && (
        <button 
          className={`flex flex-col items-center justify-center w-16 h-full text-primary`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>menu_book</span>
          <span className="font-label-sm text-[10px] mt-1">Reading</span>
        </button>
      )}

      <button 
        onClick={handleLogout} 
        className="flex flex-col items-center justify-center w-16 h-full text-on-surface-variant hover:text-error"
      >
        <span className="material-symbols-outlined text-[24px]">logout</span>
        <span className="font-label-sm text-[10px] mt-1">Logout</span>
      </button>

    </nav>
  );
};

export default MobileBottomNav;
