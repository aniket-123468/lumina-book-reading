import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import useStore from '../store/useStore';
import { apiFetch } from '../utils/api';
import { demoReaderAvatar, demoReaderDesk } from '../data/demoData';
import MobileBottomNav from '../components/MobileBottomNav';

const Reader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useStore(state => state.user);
  const clearAuth = useStore(state => state.clearAuth);

  const handleLogout = async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
    clearAuth();
    navigate('/login');
  };
  const [book, setBook] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  


  useEffect(() => {
    fetchBookData();
    fetchHighlights();
  }, [id]);

  const fetchBookData = async () => {
    try {
      const res = await apiFetch(`/books/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBook(data);
        setCurrentPage(data.currentPage || 1);
        loadPdf(id);
      }
    } catch (err) {
      console.error('Error fetching book', err);
    }
  };

  const fetchHighlights = async () => {
    try {
      const res = await apiFetch(`/highlights/${id}`);
      if (res.ok) {
        const data = await res.json();
        setHighlights(data);
      }
    } catch (err) {
      console.error('Error fetching highlights', err);
    }
  };

  const loadPdf = async (bookId) => {
    try {
      const res = await apiFetch(`/books/${bookId}/file`);
      if (!res.ok) throw new Error('Failed to download PDF');
      
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading PDF', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
      saveReadingState(currentPage);
    }
  }, [pdfDoc, currentPage, scale]);

  const renderPage = async (pageNumber) => {
    if (!pdfDoc || !canvasRef.current) return;
    
    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(pageNumber);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Calculate scale to fit container width
      const containerWidth = canvas.parentElement.clientWidth;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      // Render at a higher resolution for crispness on retina displays
      const responsiveScale = (containerWidth / unscaledViewport.width) * (window.devicePixelRatio || 1);
      
      const viewport = page.getViewport({ scale: responsiveScale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      
      // After rendering PDF, render highlights
      drawHighlights(ctx, viewport, responsiveScale);
      
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Error rendering page', err);
      }
    }
  };

  const drawHighlights = (ctx, viewport, responsiveScale) => {
    const pageHighlights = highlights.filter(h => h.pageNumber === currentPage);
    
    ctx.globalCompositeOperation = 'multiply';
    
    pageHighlights.forEach(h => {
      ctx.fillStyle = h.color || '#FDE68A'; // Default highlight yellow
      ctx.globalAlpha = 0.4;
      
      // Calculate relative position (mock logic for now, assumes stored relative percentages)
      const x = (h.rect?.x || 0.1) * viewport.width;
      const y = (h.rect?.y || 0.1) * viewport.height;
      const width = (h.rect?.width || 0.8) * viewport.width;
      const height = (h.rect?.height || 0.05) * viewport.height;
      
      ctx.fillRect(x, y, width, height);
    });
    
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  };

  const saveReadingState = async (page) => {
    try {
      await apiFetch('/reading-state', {
        method: 'PUT',
        body: JSON.stringify({ bookId: id, currentPage: page }),
      });
    } catch (err) {
      console.error('Error saving state', err);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Text selection handler to simulate creating a highlight
  const handleMouseUp = async (e) => {
    const selection = window.getSelection();
    if (!selection.toString().trim()) return;

    const text = selection.toString();
    
    // Create highlight
    try {
      const res = await apiFetch('/highlights', {
        method: 'POST',
        body: JSON.stringify({
          bookId: id,
          text: text,
          pageNumber: currentPage,
          color: '#AF9F82',
          rect: { x: 0.1, y: 0.5, width: 0.8, height: 0.05 } // Mock rect
        }),
      });
      
      if (res.ok) {
        const newHighlight = await res.json();
        setHighlights([...highlights, newHighlight]);
        renderPage(currentPage); // Re-render to show highlight
        selection.removeAllRanges();
      }
    } catch (err) {
      console.error('Error creating highlight', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={demoReaderDesk} alt="Library Desk" className="w-full h-full object-cover blur-sm" />
          <div className="absolute inset-0 bg-background/80"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="font-headline-md text-primary animate-pulse">Loading Manuscript...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen selection:bg-[#A58D6F] selection:text-[#271904]">
      {/* SideNavBar */}
      <aside className="hidden md:flex flex-col py-8 bg-surface-container-low text-primary font-body-md text-body-md h-screen w-20 fixed left-0 top-0 border-r border-outline-variant z-40 items-center shadow-sm">
        <div className="mb-12 cursor-pointer" onClick={() => navigate('/library')}>
          <span className="font-display-lg text-primary text-3xl font-bold">L</span>
        </div>
        
        <nav className="flex flex-col gap-8 flex-1 w-full items-center">
          <button onClick={() => navigate('/library')} className="flex flex-col items-center group text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined text-[24px]">library_books</span>
            <span className="font-label-sm text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Library</span>
          </button>
          
          <button onClick={() => navigate('/highlights')} className="flex flex-col items-center group text-on-surface-variant hover:text-primary transition-all">
            <span className="material-symbols-outlined text-[24px]">stylus</span>
            <span className="font-label-sm text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Notes</span>
          </button>
        </nav>
        
        <div className="mt-auto pb-6 flex flex-col items-center gap-4">
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-error transition-colors group"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="font-label-sm text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">Logout</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant book-shadow" title={user?.name}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <img src={demoReaderAvatar} alt="Scholar Avatar" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      </aside>

      {/* TopAppBar */}
      <header className="fixed top-0 right-0 left-0 md:left-20 z-30 flex justify-between items-center px-6 md:px-gutter h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex items-center gap-4 text-on-surface-variant italic truncate max-w-sm">
          <span>By {book?.author}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-low rounded-full px-3 py-1 border border-outline-variant/30">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="material-symbols-outlined p-1 rounded-full hover:bg-surface-container-highest disabled:opacity-30">chevron_left</button>
            <span className="font-code-sm text-on-surface-variant w-16 text-center">{currentPage} / {totalPages}</span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} className="material-symbols-outlined p-1 rounded-full hover:bg-surface-container-highest disabled:opacity-30">chevron_right</button>
          </div>
          <button onClick={() => setScale(s => s + 0.1)} className="material-symbols-outlined p-2 rounded-full hover:bg-surface-container-highest text-on-surface-variant">zoom_in</button>
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="material-symbols-outlined p-2 rounded-full hover:bg-surface-container-highest text-on-surface-variant">zoom_out</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 pb-24 md:pb-20 md:pl-20 min-h-screen relative flex justify-center w-full overflow-x-auto" onMouseUp={handleMouseUp}>
        <div className="reading-gradient fixed inset-0 z-10 pointer-events-none"></div>
        
        {/* Reading Canvas */}
        <div className="w-full px-4 md:px-8 py-12 md:py-16 relative z-20 flex flex-col items-center transition-all duration-300" style={{ maxWidth: `${800 * scale}px` }}>
          <article className="space-y-12 w-full flex flex-col items-center">
            {/* Metadata Header */}
            {currentPage === 1 && (
              <header className="space-y-4 mb-16 text-center w-full">
                <div className="flex items-center justify-center gap-3 text-tertiary font-label-sm text-label-sm uppercase tracking-[0.2em]">
                  <span>Lexicon Archive</span>
                  <span className="w-1 h-1 bg-tertiary rounded-full"></span>
                  <span>{book?.totalPages} Pages</span>
                </div>
                <h2 className="font-display-lg text-display-lg leading-tight text-primary px-4">{book?.title}</h2>
              </header>
            )}

            <div className="w-full bg-white book-shadow">
              <canvas ref={canvasRef} className="w-full h-auto" />
            </div>
          </article>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Reader;
