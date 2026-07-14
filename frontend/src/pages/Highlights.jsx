import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import useStore from '../store/useStore';
import { demoHighlights, demoHighlightsAvatar } from '../data/demoData';
import MobileBottomNav from '../components/MobileBottomNav';

const Highlights = () => {
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const user = useStore(state => state.user);
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
  const clearAuth = useStore(state => state.clearAuth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchHighlights();
  }, [user, navigate]);

  const fetchHighlights = async () => {
    try {
      const res = await apiFetch('/highlights');
      if (res.ok) {
        const data = await res.json();
        setHighlights(data);
      }
    } catch (err) {
      console.error('Failed to fetch highlights', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
    clearAuth();
    navigate('/login');
  };

  const toggleTheme = () => {
    const themes = ['light', 'warm-cream', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  // Group highlights by bookId
  const groupedHighlights = highlights.reduce((acc, hl) => {
    const bookId = hl.bookId?._id;
    if (!bookId) return acc;
    if (!acc[bookId]) {
      acc[bookId] = {
        book: hl.bookId,
        items: []
      };
    }
    acc[bookId].items.push(hl);
    return acc;
  }, {});

  return (
    <div className="bg-background text-on-surface min-h-screen flex">
      {/* SideNavBar (Desktop Only) */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full z-40 flex-col items-center py-8 bg-surface-container shadow-sm w-20 transition-all duration-300 ease-in-out border-r border-outline-variant/30">
        <div className="mb-10 mt-4 cursor-pointer" onClick={() => navigate('/library')}>
          <span className="font-display-lg text-primary text-3xl font-bold">L</span>
        </div>
        
        <div className="flex flex-col gap-8 flex-1 w-full items-center">
          <button onClick={() => navigate('/library')} className="flex flex-col items-center group text-secondary hover:text-primary transition-all">
            <span className="material-symbols-outlined text-[24px]">library_books</span>
            <span className="font-label-sm text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Library</span>
          </button>
          
          <button className="flex flex-col items-center group text-primary font-bold border-r-2 border-primary transition-all w-full cursor-default">
            <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>stylus_note</span>
            <span className="font-label-sm text-[10px] mt-1">Highlights</span>
          </button>
        </div>
        
        <div className="mt-auto mb-6 flex flex-col items-center gap-4">
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-error transition-colors group"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="font-label-sm text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">Logout</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant book-shadow" title={user?.name}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <img src={demoHighlightsAvatar} alt="Scholar Avatar" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      </nav>

      {/* TopAppBar */}
      <header className="fixed top-0 right-0 left-0 md:left-20 z-30 flex justify-between items-center px-6 md:px-margin-desktop py-4 bg-surface/90 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex items-center">
          <h1 className="font-headline-lg text-headline-md md:text-headline-lg text-primary tracking-tight">Lexicon Reader</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">search</span>
            <input className="bg-surface-container-low border-none border-b border-transparent focus:border-primary focus:ring-0 font-label-md text-sm pl-10 pr-4 py-2 w-64 transition-all rounded-t-sm" placeholder="Search annotations..." type="text" />
          </div>
          <div className="flex gap-4 text-on-surface-variant">
            <button onClick={toggleTheme} className="hover:bg-surface-container-low p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">brightness_medium</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-20 pt-24 min-h-screen px-6 md:px-margin-desktop pb-24 md:pb-20 w-full">
        <div className="max-w-[680px] mx-auto">
          {/* Page Header */}
          <div className="mb-12 border-b border-outline-variant/30 pb-8">
            <h2 className="font-headline-lg text-3xl mb-2 text-primary">Highlights & Annotations</h2>
            <p className="font-body-md text-on-surface-variant">{highlights.length} saved highlights across {Object.keys(groupedHighlights).length} volumes.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : highlights.length === 0 ? (
            <>
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4 opacity-50">stylus</span>
                <h4 className="font-headline-md text-secondary">No highlights yet</h4>
                <p className="font-body-md text-on-surface-variant max-w-sm mt-2 mb-12">Here are some sample annotations to show you how Lexicon preserves your thoughts.</p>
              </div>
              
              {/* Demo Highlights Render */}
              {Object.values(
                demoHighlights.reduce((acc, hl) => {
                  const bookId = hl.bookId?._id;
                  if (!acc[bookId]) acc[bookId] = { book: hl.bookId, items: [] };
                  acc[bookId].items.push(hl);
                  return acc;
                }, {})
              ).map(group => (
                <section key={group.book._id} className="mb-16 opacity-80">
                  <div className="flex items-start gap-6 mb-8 cursor-default group/book">
                    <div className="w-24 aspect-[3/4] bg-surface-container shadow-sm overflow-hidden flex-shrink-0 border border-outline-variant rounded-sm book-shadow">
                      <img src={group.book.coverUrl} alt={group.book.title} className="w-full h-full object-cover opacity-90" />
                    </div>
                    <div>
                      <span className="font-label-sm text-xs text-surface-tint uppercase tracking-widest">{group.book.author}</span>
                      <h3 className="font-display-lg text-2xl md:text-3xl mt-1 text-primary">{group.book.title}</h3>
                      <p className="font-label-md text-sm text-secondary mt-2">Sample annotations</p>
                    </div>
                  </div>
                  <div className="space-y-10 pl-4 md:pl-8">
                    {group.items.map(item => (
                      <div key={item._id} className="group">
                        <div className="flex justify-between items-baseline mb-3">
                          <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest">
                            Page {item.pageNumber} • Sample
                          </span>
                        </div>
                        <p className="font-body-xl text-lg md:text-xl vellum-highlight py-2 px-3 -mx-3 leading-relaxed italic rounded-sm transition-colors">
                          "{item.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </>
          ) : (
            Object.values(groupedHighlights).map(group => (
              <section key={group.book._id} className="mb-16">
                {/* Book Header */}
                <div 
                  className="flex items-start gap-6 mb-8 cursor-pointer group/book"
                  onClick={() => navigate(`/read/${group.book._id}`)}
                >
                  <div className="w-24 aspect-[3/4] bg-surface-container shadow-sm overflow-hidden flex-shrink-0 border border-outline-variant rounded-sm group-hover/book:shadow-md transition-all book-shadow">
                    {group.book.coverUrl ? (
                      <img src={group.book.coverUrl} alt={group.book.title} className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <div className="w-full h-full bg-primary/10"></div>
                    )}
                  </div>
                  <div>
                    <span className="font-label-sm text-xs text-surface-tint uppercase tracking-widest">{group.book.author}</span>
                    <h3 className="font-display-lg text-2xl md:text-3xl mt-1 text-primary group-hover/book:underline decoration-primary/30 underline-offset-4">{group.book.title}</h3>
                    <p className="font-label-md text-sm text-secondary mt-2">{group.items.length} annotations</p>
                  </div>
                </div>

                {/* Annotation Entries */}
                <div className="space-y-10 pl-4 md:pl-8">
                  {group.items.map(item => (
                    <div key={item._id} className="group">
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest">
                          Page {item.pageNumber} • Highlighted {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-[18px]">share</span></button>
                          <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                          <button className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                      </div>
                      <p className="font-body-xl text-lg md:text-xl vellum-highlight py-2 px-3 -mx-3 leading-relaxed italic rounded-sm transition-colors">
                        "{item.text || 'Visual Highlight (No Text Extracted)'}"
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Highlights;
