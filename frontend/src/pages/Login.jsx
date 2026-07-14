import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useStore from '../store/useStore';
import { apiFetch } from '../utils/api';
import ThreeJsBackground from '../components/ThreeJsBackground';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bgRef = useRef(null);
  
  const navigate = useNavigate();
  const setAuth = useStore(state => state.setAuth);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!bgRef.current) return;
      const moveX = (e.clientX - window.innerWidth / 2) / 50;
      const moveY = (e.clientY - window.innerHeight / 2) / 50;
      bgRef.current.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAuth(data.user, data.accessToken);
        navigate('/library');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="bg-surface text-on-surface selection:bg-tertiary-fixed selection:text-on-tertiary-fixed min-h-screen flex flex-col overflow-x-hidden">
      {/* Background Layer with Image & Overlay */}
      <div className="fixed inset-0 z-0 bg-black">
        {/* 1. Base Image */}
        <div 
          ref={bgRef}
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-75 scale-110 z-0" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCXqZqQeH2ppBBY52shClPbd8sI4l1KTfS42TXZ00X0mzmjsiFRYjf-z49ym5PG_a62veyJlI-dLhinMKVASSvtVEubE-JGCyWsvjaPI6GwcImgMOKbf9ZJAHr8SNV0mhd18NSb8YHrKdsEGkgRhz84g4hOXawxBaICIAQegoYAfiJQsPiFyK7CLxuV9-ATtImNzGoZr7EUv_uqs8mGPjpFTDESHF9169AYUsSFLtVwK4O9dORDRVa-DzAoV9WdTO4SbanBXGvEGA')" }}
        ></div>
        
        {/* 2. Dark Overlay & Blur */}
        <div className="absolute inset-0 bg-black/70 z-10 backdrop-blur-md"></div>
        
        {/* 3. ThreeJS Animation on top of the blur */}
        <div className="absolute inset-0 z-20 opacity-90 pointer-events-none mix-blend-screen flex items-center justify-center">
          <ThreeJsBackground />
        </div>
      </div>
      
      {/* Main Content Wrapper (Centered for Auth) */}
      <main className="relative z-20 flex-grow flex items-center justify-center p-margin-mobile md:p-0">
        {/* Authentication Card */}
        <section className="w-full max-w-md bg-[#F5F1EA] border border-[#5C4033]/10 rounded-xl shadow-2xl overflow-hidden flex flex-col items-center py-12 px-8 md:px-10">
          
          {/* Branding Header */}
          <header className="text-center mb-stack-lg">
            <h1 className="font-display-lg text-display-lg text-primary tracking-tight leading-none mb-2">Lexicon</h1>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Digital Manuscript</p>
          </header>
          
          {error && <div className="text-error mb-4 font-label-sm">{error}</div>}
          
          {/* Login Form */}
          <form className="w-full flex flex-col gap-stack-md" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="flex flex-col gap-1 group">
              <label className="font-label-sm text-label-sm text-on-surface-variant px-1 group-focus-within:text-tertiary transition-colors" htmlFor="email">Email</label>
              <input 
                className="w-full bg-[#F0EDE7] border border-outline-variant/30 rounded px-4 py-3 font-body-md text-body-md text-on-surface input-focus-accent transition-all" 
                id="email" 
                name="email" 
                placeholder="scribes@lexicon.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {/* Password Field */}
            <div className="flex flex-col gap-1 group">
              <div className="flex justify-between items-center px-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant group-focus-within:text-tertiary transition-colors" htmlFor="password">Password</label>
                <a className="font-label-sm text-label-sm text-tertiary hover:underline" href="#">Forgot?</a>
              </div>
              <div className="relative">
                <input 
                  className="w-full bg-[#F0EDE7] border border-outline-variant/30 rounded px-4 py-3 font-body-md text-body-md text-on-surface input-focus-accent transition-all" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Open Library Button (Primary Action) */}
            <button 
              className="mt-stack-sm w-full bg-primary-container text-on-primary py-4 rounded font-label-sm text-label-sm uppercase tracking-widest hover:bg-primary transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 group/btn" 
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Opening...' : 'Open Library'}</span>
              <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-1 transition-transform">menu_book</span>
            </button>
          </form>
          
          {/* Divider */}
          <div className="w-full flex items-center gap-4 my-stack-lg">
            <div className="h-[1px] flex-grow bg-outline-variant/20"></div>
            <span className="font-label-sm text-label-sm text-outline-variant italic">or</span>
            <div className="h-[1px] flex-grow bg-outline-variant/20"></div>
          </div>
          
          {/* Alternative Auth */}
          <div className="w-full flex flex-col gap-stack-sm">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full border border-outline-variant/50 py-3 rounded font-label-sm text-label-sm text-secondary hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"></path>
              </svg>
              Continue with Google
            </button>
          </div>
          
          {/* Footer Link */}
          <footer className="mt-stack-lg text-center">
            <p className="font-body-md text-body-md text-secondary">
              New to the collection? 
              <Link className="text-tertiary font-semibold hover:underline decoration-tertiary/30 underline-offset-4 ml-1" to="/signup">Sign Up</Link>
            </p>
          </footer>
        </section>
      </main>
      
      {/* Page Footer */}
      <footer className="relative z-20 p-8 text-center">
        <p className="font-label-sm text-label-sm text-on-primary/60 tracking-wider">
          © 1884 — 2024 LEXICON PUBLISHING HOUSE. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
};

export default Login;
