import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import useStore from '../store/useStore';
import { apiFetch } from '../utils/api';
import { demoBooks, demoLibraryAvatar } from '../data/demoData';
import MobileBottomNav from '../components/MobileBottomNav';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const Library = () => {
  const [books, setBooks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const user = useStore(state => state.user);
  const clearAuth = useStore(state => state.clearAuth);
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'warm-cream' : 'light';
    setTheme(next);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await apiFetch('/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) {
      console.error('Failed to fetch books', err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const extractPDFMetadata = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Get page count
    const totalPages = pdf.numPages;
    
    // Render first page as thumbnail
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;
    
    const coverDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    return {
      totalPages,
      coverUrl: coverDataUrl,
      title: file.name.replace('.pdf', '')
    };
  };

  const handleFileUpload = async (file) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const metadata = await extractPDFMetadata(file);
      setUploadProgress(40);
      
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('title', metadata.title);
      formData.append('author', 'Unknown Author');
      formData.append('totalPages', metadata.totalPages);
      formData.append('coverUrl', metadata.coverUrl);

      setUploadProgress(60);

      const res = await apiFetch('/books', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploadProgress(100);
        fetchBooks();
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error', err);
      alert('Failed to upload manuscript.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {}
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">
      <div className="parchment-grain"></div>
      
      {/* Side Navigation Bar (Desktop Only) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-8 border-r border-outline-variant/30 bg-surface z-40 shadow-sm">
        <div onClick={() => navigate('/library')} className="font-display-lg text-primary text-3xl mb-12 cursor-pointer hover:opacity-80 transition-opacity">L</div>
        
        <nav className="flex flex-col gap-8 w-full items-center">
          <div className="flex flex-col items-center gap-1 text-primary font-bold border-r-2 border-primary cursor-default w-full justify-center">
            <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>upload_file</span>
            <span className="font-label-sm text-[10px]">Upload</span>
          </div>

          <button onClick={() => navigate('/highlights')} className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors group cursor-pointer">
            <span className="material-symbols-outlined text-[24px]">edit_note</span>
            <span className="font-label-sm text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Notes</span>
          </button>
        </nav>
        
        <div className="mt-auto pb-6 flex flex-col items-center gap-4">
          {/* Logout button */}
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
              <img src={demoLibraryAvatar} alt="Default Scholar Avatar" className="w-full h-full object-cover opacity-80" />
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-20 flex-grow min-h-screen flex flex-col items-center relative z-10 w-full overflow-x-hidden pb-24 md:pb-0">
        
        {/* Header Section */}
        <header className="w-full max-w-container-max px-6 md:px-margin-desktop py-12 flex justify-between items-end">
          <div className="space-y-1">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">New Session</p>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Ingest Document</h1>
          </div>
          <div className="flex gap-4">
            <button onClick={toggleTheme} title="Toggle Theme" className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container transition-colors rounded-full">
              brightness_medium
            </button>
          </div>
        </header>

        {/* Centered Upload Zone */}
        <section className="w-full max-w-[680px] px-6 py-8">
          <div 
            className={`relative group cursor-pointer border-2 border-dashed ${isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface-container-low'} rounded-xl aspect-[16/10] flex flex-col items-center justify-center transition-all duration-500 hover:bg-surface-container hover:border-primary/40`}
            id="drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              accept=".pdf" 
              className="hidden" 
              id="file-input" 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => {
                if(e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]);
              }}
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <h2 className="font-headline-md text-xl text-primary text-center mb-2">Analyzing Manuscript...</h2>
                <div className="w-64 bg-outline-variant/30 rounded-full h-2 mt-4 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-surface-container-highest transition-transform duration-500 group-hover:scale-110 book-shadow">
                  <span className="material-symbols-outlined text-[40px] text-primary">upload_file</span>
                </div>
                <h2 className="font-headline-lg text-headline-md md:text-headline-lg text-primary text-center mb-2 px-4">Drop your PDF here to begin your next journey</h2>
                <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-md px-4">
                  Or <span className="text-primary underline font-medium cursor-pointer">browse your files</span> to select a manuscript for deep reading.
                </p>
                
                <div className="absolute bottom-6 flex gap-4 md:gap-8 flex-wrap justify-center">
                  <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                    <span class="material-symbols-outlined text-[18px]">speed</span>
                    <span>Smart OCR</span>
                  </div>
                  <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">cloud_done</span>
                    <span>Auto-Sync</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Recently Uploaded Section */}
        <section className="w-full max-w-container-max px-6 md:px-margin-desktop py-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline-lg text-headline-md md:text-headline-lg text-primary">Recently Uploaded</h3>
            <button className="font-label-md text-label-md text-primary flex items-center gap-2 hover:opacity-70 transition-opacity">
              View all Library
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Bento-style Grid for Recent Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(book => {
              const progressPercentage = book.totalPages > 0 
                ? Math.round((book.currentPage / book.totalPages) * 100) 
                : 0;

              return (
                <div 
                  key={book._id}
                  onClick={() => navigate(`/read/${book._id}`)}
                  className="bg-surface border border-outline-variant p-6 rounded-lg flex gap-5 hover:bg-surface-container transition-all duration-300 cursor-pointer group book-shadow"
                >
                  <div className="w-24 h-32 bg-tertiary-container flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 relative overflow-hidden">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <div className="w-full h-full bg-primary/10"></div>
                    )}
                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-300"></div>
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant mb-1">{timeAgo(book.createdAt)}</span>
                    <h4 className="font-label-md text-label-md text-primary font-bold mb-1 truncate" title={book.title}>{book.title}</h4>
                    <p className="text-[13px] text-on-secondary-container truncate italic">{book.author}</p>
                    
                    <div className="mt-3 flex items-center gap-4">
                      <span className="text-[12px] font-code-sm text-on-surface-variant">{book.totalPages} Pages</span>
                      <div className="h-1 w-1 rounded-full bg-outline-variant"></div>
                      {progressPercentage === 0 ? (
                        <span className="text-[12px] font-label-sm text-primary">New</span>
                      ) : progressPercentage === 100 ? (
                        <span className="text-[12px] font-label-sm text-primary">Completed</span>
                      ) : (
                        <span className="text-[12px] font-label-sm text-primary">{progressPercentage}% Read</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {books.length === 0 && !isUploading && (
              <>
                <div className="col-span-full py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">auto_awesome</span>
                  <h3 className="font-headline-md text-primary">Your library is currently empty.</h3>
                  <p className="font-body-md text-secondary mt-2">Here are some featured manuscripts to inspire you:</p>
                </div>
                {demoBooks.map(book => (
                  <div 
                    key={book._id}
                    className="bg-surface border border-outline-variant p-6 rounded-lg flex gap-5 hover:bg-surface-container transition-all duration-300 cursor-pointer group book-shadow opacity-80 hover:opacity-100"
                  >
                    <div className="w-24 h-32 bg-tertiary-container flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 relative overflow-hidden">
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-300"></div>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="font-label-sm text-label-sm text-on-surface-variant mb-1">Featured</span>
                      <h4 className="font-label-md text-label-md text-primary font-bold mb-1 truncate" title={book.title}>{book.title}</h4>
                      <p className="text-[13px] text-on-secondary-container truncate italic">{book.author}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* Footer / Stats */}
        <footer className="mt-auto py-12 w-full max-w-container-max px-6 md:px-margin-desktop border-t border-outline-variant/30 flex justify-between items-center opacity-60">
          <div className="flex gap-4 md:gap-8 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant flex-wrap">
            <span>Storage: {books.length} Books</span>
            <span>Active Journals: {books.filter(b => b.currentPage > 1 && b.currentPage < b.totalPages).length}</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant hidden md:inline">© 2024 Lexicon Systems</span>
          </div>
        </footer>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Library;
