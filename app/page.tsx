'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_PAGES } from '@/lib/demos-data';
import { 
  getComments, 
  saveComments, 
  addComment, 
  toggleResolve, 
  deleteComment, 
  getUserName, 
  setUserName,
  SimpleComment 
} from '@/lib/comments-store';
import { 
  MousePointer, 
  MessageSquare, 
  Check, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Edit2, 
  X, 
  Send, 
  ExternalLink,
  MapPin,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [selectedPageId, setSelectedPageId] = useState<string>('debitinfo.ge_1');
  const [userName, setUserNameState] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // 'select' or 'comment'
  const [toolMode, setToolMode] = useState<'select' | 'comment'>('select');

  // Comments & Active Pin
  const [comments, setComments] = useState<SimpleComment[]>([]);
  const [activePinId, setActivePinId] = useState<string | null>(null);

  // Draft Comment Popover state
  const [draftComment, setDraftComment] = useState<{
    x: number;
    y: number;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [draftText, setDraftText] = useState<string>('');
  const [namePromptError, setNamePromptError] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load user name & comments
  useEffect(() => {
    const name = getUserName();
    setUserNameState(name);
    setTempName(name);
    if (!name) {
      setIsEditingName(true);
    }

    const loadComments = () => setComments(getComments());
    loadComments();
    window.addEventListener('debitinfo_comments_changed', loadComments);
    return () => window.removeEventListener('debitinfo_comments_changed', loadComments);
  }, []);

  const currentPage = DEMO_PAGES.find(p => p.id === selectedPageId) || DEMO_PAGES[0];
  const pageComments = comments.filter(c => c.pageId === selectedPageId);

  // Keyboard shortcut listener: 'c' for comment, 'v' or 'Escape' for select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        setToolMode('comment');
      } else if (e.key === 'v' || e.key === 'V' || e.key === 'Escape') {
        setToolMode('select');
        setDraftComment(null);
        setActivePinId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save User Name
  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tempName.trim()) return;
    setUserName(tempName.trim());
    setUserNameState(tempName.trim());
    setIsEditingName(false);
    setNamePromptError('');
  };

  // Helper to sync pins into the iframe DOM
  const syncPinsToIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;
    const doc = iframe.contentDocument;

    // Check if doc body exists
    if (!doc.body) return;

    // Set cursor style based on toolMode
    if (toolMode === 'comment') {
      doc.body.style.cursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='%230D45FC' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/></svg>") 0 20, crosshair`;
    } else {
      doc.body.style.cursor = 'default';
    }

    // Ensure pins container element exists inside iframe body
    let pinContainer = doc.getElementById('debitinfo-pins-container');
    if (!pinContainer) {
      pinContainer = doc.createElement('div');
      pinContainer.id = 'debitinfo-pins-container';
      pinContainer.style.position = 'absolute';
      pinContainer.style.top = '0';
      pinContainer.style.left = '0';
      pinContainer.style.width = '100%';
      pinContainer.style.height = '100%';
      pinContainer.style.pointerEvents = 'none';
      pinContainer.style.zIndex = '999999';
      doc.body.style.position = 'relative';
      doc.body.appendChild(pinContainer);
    }

    // Render pins inside the iframe
    pinContainer.innerHTML = '';
    const scrollH = doc.documentElement.scrollHeight || doc.body.scrollHeight;
    const scrollW = doc.documentElement.scrollWidth || doc.body.scrollWidth;

    pageComments.forEach((c, index) => {
      const pinEl = doc.createElement('div');
      pinEl.id = `pin-${c.id}`;
      pinEl.style.position = 'absolute';
      pinEl.style.left = `${(c.x / 100) * scrollW}px`;
      pinEl.style.top = `${(c.y / 100) * scrollH}px`;
      pinEl.style.transform = 'translate(-50%, -50%)';
      pinEl.style.pointerEvents = 'auto';
      pinEl.style.cursor = 'pointer';
      pinEl.style.zIndex = c.id === activePinId ? '1000000' : '999999';

      const isResolved = c.resolved;
      const isSelected = c.id === activePinId;

      pinEl.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 9999px;
          font-family: monospace;
          font-size: 12px;
          font-weight: bold;
          color: white;
          background: ${isResolved ? '#059669' : '#0D45FC'};
          border: 2px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          transition: transform 0.15s ease;
          ${isSelected ? 'transform: scale(1.25); outline: 3px solid #0D45FC; outline-offset: 2px;' : ''}
        ">
          ${isResolved ? '✓' : index + 1}
        </div>
      `;

      // Hover effect
      pinEl.onmouseenter = () => {
        pinEl.style.transform = 'translate(-50%, -50%) scale(1.2)';
      };
      pinEl.onmouseleave = () => {
        pinEl.style.transform = isSelected ? 'translate(-50%, -50%) scale(1.25)' : 'translate(-50%, -50%) scale(1)';
      };

      // Click pin opens details in main React state
      pinEl.onclick = (e) => {
        e.stopPropagation();
        setActivePinId(c.id);
        setDraftComment(null);
      };

      pinContainer?.appendChild(pinEl);
    });

  }, [toolMode, pageComments, activePinId]);

  // Attach click listener to iframe document for dropping comments
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const handleIframeClick = (e: MouseEvent) => {
        if (toolMode !== 'comment') return;

        // Ensure user entered their name
        const currentName = getUserName();
        if (!currentName) {
          setIsEditingName(true);
          setNamePromptError('Please enter your name first');
          setIsSidebarOpen(true);
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const scrollW = doc.documentElement.scrollWidth || doc.body.scrollWidth;
        const scrollH = doc.documentElement.scrollHeight || doc.body.scrollHeight;

        const x = (e.pageX / scrollW) * 100;
        const y = (e.pageY / scrollH) * 100;

        const iframeRect = iframe.getBoundingClientRect();
        const screenX = iframeRect.left + e.clientX;
        const screenY = iframeRect.top + e.clientY;

        setDraftComment({
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10,
          screenX,
          screenY,
        });
        setActivePinId(null);
      };

      doc.removeEventListener('click', handleIframeClick);
      doc.addEventListener('click', handleIframeClick);
      syncPinsToIframe();
    };

    iframe.addEventListener('load', handleIframeLoad);
    handleIframeLoad();

    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [toolMode, syncPinsToIframe]);

  // Keep pins synced whenever comments or active pin changes
  useEffect(() => {
    syncPinsToIframe();
  }, [syncPinsToIframe]);

  // Scroll to pin when clicked in sidebar
  const handleScrollToPin = (comment: SimpleComment) => {
    setActivePinId(comment.id);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !iframe.contentWindow) return;

    const doc = iframe.contentDocument;
    const scrollH = doc.documentElement.scrollHeight || doc.body.scrollHeight;
    const targetY = (comment.y / 100) * scrollH;

    iframe.contentWindow.scrollTo({
      top: Math.max(0, targetY - 180),
      behavior: 'smooth',
    });
  };

  // Post Draft Comment
  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draftText.trim() || !draftComment) return;

    const author = userName.trim() || 'Reviewer';
    const newComment = addComment({
      pageId: selectedPageId,
      author,
      text: draftText.trim(),
      x: draftComment.x,
      y: draftComment.y,
    });

    setDraftComment(null);
    setDraftText('');
    setToolMode('select');
    setActivePinId(newComment.id);
  };

  const activeCommentObj = pageComments.find(c => c.id === activePinId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      
      {/* 1. Left Sidebar: Page List & Comments on Selected Page */}
      <aside 
        className={`bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-all duration-300 z-40 ${
          isSidebarOpen ? 'w-80' : 'w-0'
        } overflow-hidden`}
      >
        <div className="w-80 flex flex-col h-full">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-mono font-bold text-white shadow-md shadow-blue-500/20">
                D
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">Debitinfo Demos</h1>
                <p className="text-[11px] text-slate-400">Design Reviews & Comments</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Hide Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* User Name Identity */}
          <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="space-y-2">
                <label className="block text-[11px] font-semibold text-blue-400 uppercase tracking-wide">
                  თქვენი სახელი / Your Name:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="მაგ: გიორგი, დიზაინერი..."
                    className="flex-1 px-2.5 py-1 text-xs rounded-md bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    OK
                  </button>
                </div>
                {namePromptError && (
                  <p className="text-[10px] text-rose-400">{namePromptError}</p>
                )}
              </form>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-slate-400 text-[10px] block leading-none">Reviewer:</span>
                    <span className="font-semibold text-white truncate">{userName || 'Anonymous'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                  title="Edit Name"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Pages List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              გვერდები / Pages ({DEMO_PAGES.length})
            </div>

            {DEMO_PAGES.map((page, idx) => {
              const isSelected = selectedPageId === page.id;
              const count = comments.filter(c => c.pageId === page.id && !c.resolved).length;

              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPageId(page.id);
                    setActivePinId(null);
                    setDraftComment(null);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 text-xs ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="truncate">{page.titleKa}</span>
                  </div>

                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono shrink-0 ${
                      isSelected ? 'bg-white text-blue-700' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Page Comments Section */}
            <div className="pt-4 border-t border-slate-800 mt-4">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>ამ გვერდის შენიშვნები ({pageComments.length})</span>
              </div>

              {pageComments.length === 0 ? (
                <p className="px-2 py-3 text-[11px] text-slate-500">
                  ჯერ შენიშვნები არაა. დააჭირეთ Comment (C) ღილაკს და დააკლიკეთ გვერდზე.
                </p>
              ) : (
                <div className="space-y-1.5 mt-1.5">
                  {pageComments.map((comment, index) => {
                    const isSelected = activePinId === comment.id;

                    return (
                      <div
                        key={comment.id}
                        onClick={() => handleScrollToPin(comment)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-500/10 border-blue-500 text-white ring-1 ring-blue-500'
                            : comment.resolved
                            ? 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60'
                            : 'bg-slate-800/50 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                              comment.resolved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                            }`}>
                              #{index + 1}
                            </span>
                            <span className="font-semibold text-slate-300 text-[11px]">
                              {comment.author}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleResolve(comment.id);
                              }}
                              className={`p-1 rounded hover:bg-slate-700 ${
                                comment.resolved ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                              title={comment.resolved ? 'Mark as Open' : 'Mark as Resolved'}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteComment(comment.id);
                                if (activePinId === comment.id) setActivePinId(null);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700"
                              title="Delete Comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className={`text-[11px] leading-relaxed ${comment.resolved ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {comment.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Footer: Open Raw HTML in new tab */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80">
            <a
              href={currentPage.htmlPath}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>სრული HTML გახსნა</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </aside>

      {/* Collapse button when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-3 top-3 z-50 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-xl hover:bg-slate-800 transition-colors"
          title="Open Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* 2. Main Viewport & Figma Toolbar */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-slate-950">
        
        {/* Floating Figma-style Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 rounded-full bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md">
          
          {/* Select Tool (V) */}
          <button
            onClick={() => {
              setToolMode('select');
              setDraftComment(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              toolMode === 'select'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Interact with page (Key: V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Select (V)</span>
          </button>

          {/* Comment Tool (C) */}
          <button
            onClick={() => {
              const currentName = getUserName();
              if (!currentName) {
                setIsEditingName(true);
                setNamePromptError('Please enter your name first');
                setIsSidebarOpen(true);
              }
              setToolMode('comment');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              toolMode === 'comment'
                ? 'bg-blue-600 text-white shadow-sm font-semibold animate-pulse'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Drop comments anywhere on page (Key: C)"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-300" />
            <span>Comment (C)</span>
            {pageComments.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] font-mono flex items-center justify-center font-bold">
                {pageComments.length}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />
          <span className="text-[11px] text-slate-400 pr-2 font-mono truncate max-w-[200px]">
            {currentPage.titleKa}
          </span>
        </div>

        {/* Comment Tool Guidance Banner */}
        {toolMode === 'comment' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-blue-600/90 text-white text-xs shadow-lg backdrop-blur-md flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>დააწკაპუნეთ ნებისმიერ ადგილზე შენიშვნის დასატოვებლად (Esc to exit)</span>
          </div>
        )}

        {/* Viewport Frame Container */}
        <div ref={containerRef} className="flex-1 relative w-full h-full bg-white">
          <iframe
            ref={iframeRef}
            src={currentPage.htmlPath}
            title={currentPage.titleKa}
            className="w-full h-full border-0"
          />

          {/* New Comment Draft Popover */}
          {draftComment && (
            <div
              style={{
                left: `${draftComment.screenX}px`,
                top: `${draftComment.screenY}px`,
              }}
              className="fixed z-50 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 pointer-events-auto"
            >
              {/* Pin indicator */}
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shadow-lg ring-4 ring-offset-2 ring-blue-500 animate-bounce">
                +
              </div>

              {/* Popover Form */}
              <form
                onSubmit={handlePostComment}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-left"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-300 text-[11px]">
                    Comment as <strong className="text-white">{userName || 'Reviewer'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftComment(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <textarea
                  autoFocus
                  rows={3}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                  placeholder="დაწერეთ შენიშვნა ამ ადგილზე..."
                  className="w-full p-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none mb-2"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Ctrl+Enter</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDraftComment(null)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                    >
                      გაუქმება
                    </button>
                    <button
                      type="submit"
                      disabled={!draftText.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Active Pin Details Popover */}
          {activeCommentObj && (
            <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    activeCommentObj.resolved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {activeCommentObj.resolved ? '✓' : '#'}
                  </div>
                  <span className="font-bold text-white">{activeCommentObj.author}</span>
                </div>
                <button
                  onClick={() => setActivePinId(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className={`text-xs leading-relaxed mb-3 ${activeCommentObj.resolved ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                {activeCommentObj.text}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  onClick={() => toggleResolve(activeCommentObj.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeCommentObj.resolved
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{activeCommentObj.resolved ? 'Resolved' : 'Resolve'}</span>
                </button>

                <button
                  onClick={() => {
                    deleteComment(activeCommentObj.id);
                    setActivePinId(null);
                  }}
                  className="text-slate-400 hover:text-rose-400 p-1"
                  title="Delete Comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
