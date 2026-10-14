'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DEMO_PAGES } from '@/lib/demos-data';
import { 
  fetchRemoteComments, 
  getLocalComments, 
  addComment, 
  addReply,
  deleteReply,
  toggleResolve, 
  deleteComment, 
  getUserName, 
  setUserName,
  SimpleComment,
  CommentReply
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
  CornerDownRight,
  MessageCircle
} from 'lucide-react';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ka-GE', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return '';
  }
}

export default function App() {
  const [selectedPageId, setSelectedPageId] = useState<string>('debitinfo.ge_1');
  const [userName, setUserNameState] = useState<string>('');
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // 'select' or 'comment'
  const [toolMode, setToolMode] = useState<'select' | 'comment'>('select');

  // Comments & Active Pin
  const [comments, setComments] = useState<SimpleComment[]>([]);
  const [activePinId, setActivePinId] = useState<string | null>(null);

  // Sidebar Reply state for each comment: commentId -> boolean
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [sidebarReplyText, setSidebarReplyText] = useState<string>('');

  // Draft Comment Popover state
  const [draftComment, setDraftComment] = useState<{
    x: number;
    y: number;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [draftText, setDraftText] = useState<string>('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep ref to latest comments for event handlers inside iframe
  const commentsRef = useRef<SimpleComment[]>(comments);
  commentsRef.current = comments;

  const userNameRef = useRef<string>(userName);
  userNameRef.current = userName;

  // Initial load from cloud DB and background polling for real-time cross-platform sync
  useEffect(() => {
    const name = getUserName();
    setUserNameState(name);
    setTempName(name);

    // Initial load from cloud database
    fetchRemoteComments().then(data => {
      if (data && data.length > 0) setComments(data);
    });

    // Real-time polling every 3 seconds (syncs across computers and incognito tabs)
    const interval = setInterval(() => {
      fetchRemoteComments().then(data => {
        if (data) setComments(data);
      });
    }, 3000);

    const handleLocalChange = () => setComments(getLocalComments());
    window.addEventListener('debitinfo_comments_changed', handleLocalChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('debitinfo_comments_changed', handleLocalChange);
    };
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
        handleActivateCommentMode();
      } else if (e.key === 'v' || e.key === 'V' || e.key === 'Escape') {
        setToolMode('select');
        setDraftComment(null);
        setActivePinId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userName]);

  // Handle Comment Tool click with Obvious Name Prompt
  const handleActivateCommentMode = () => {
    const currentName = getUserName();
    if (!currentName) {
      setTempName('');
      setIsNameModalOpen(true);
      return;
    }
    setToolMode('comment');
    setActivePinId(null);
  };

  // Save User Name from Modal
  const handleSaveNameModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = tempName.trim();
    if (!finalName) return;

    setUserName(finalName);
    setUserNameState(finalName);
    setIsNameModalOpen(false);
    setToolMode('comment'); // Immediately activate comment tool!
  };

  const handleToggleResolve = (id: string) => {
    setComments(prev => toggleResolve(prev, id));
  };

  const handleDeleteComment = (id: string) => {
    setComments(prev => deleteComment(prev, id));
    if (activePinId === id) setActivePinId(null);
  };

  const handleAddReplyToComment = useCallback((commentId: string, replyText: string) => {
    const currentName = getUserName();
    if (!currentName) {
      setIsNameModalOpen(true);
      return;
    }
    if (!replyText.trim()) return;

    const { updated } = addReply(commentsRef.current, commentId, {
      author: currentName,
      text: replyText.trim(),
    });
    setComments(updated);
  }, []);

  const handleDeleteReplyFromComment = useCallback((commentId: string, replyId: string) => {
    const updated = deleteReply(commentsRef.current, commentId, replyId);
    setComments(updated);
  }, []);

  // Helper to sync pins & popovers into the iframe DOM (with Smart Boundary Detection & Replies!)
  const syncPinsToIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;
    const doc = iframe.contentDocument;
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

    // Clear previous pins
    pinContainer.innerHTML = '';
    const scrollH = doc.documentElement.scrollHeight || doc.body.scrollHeight;
    const scrollW = doc.documentElement.scrollWidth || doc.body.scrollWidth;

    pageComments.forEach((c, index) => {
      const pinWrapper = doc.createElement('div');
      pinWrapper.id = `pin-wrap-${c.id}`;
      pinWrapper.style.position = 'absolute';

      const pinPixelX = (c.x / 100) * scrollW;
      const pinPixelY = (c.y / 100) * scrollH;

      pinWrapper.style.left = `${pinPixelX}px`;
      pinWrapper.style.top = `${pinPixelY}px`;
      pinWrapper.style.pointerEvents = 'auto';
      pinWrapper.style.zIndex = c.id === activePinId ? '1000000' : '999998';

      const isResolved = c.resolved;
      const isSelected = c.id === activePinId;
      const replies = Array.isArray(c.replies) ? c.replies : [];

      // Smart Boundary Detection:
      // If pin is near the top of document (y < 16% or pinPixelY < 230px), open DOWNWARDS so it NEVER clips off screen!
      const opensDownward = pinPixelY < 230 || c.y < 16;

      // Horizontal alignment: clamp if near left or right edge of document
      const isNearLeft = pinPixelX < 170;
      const isNearRight = pinPixelX > (scrollW - 170);

      let horizontalPopoverStyle = 'left: 50%; transform: translateX(-50%);';
      let arrowHorizontalStyle = 'left: 50%; transform: translateX(-50%);';
      if (isNearLeft) {
        horizontalPopoverStyle = 'left: -10px; transform: none;';
        arrowHorizontalStyle = 'left: 24px; transform: none;';
      } else if (isNearRight) {
        horizontalPopoverStyle = 'right: -10px; left: auto; transform: none;';
        arrowHorizontalStyle = 'right: 24px; left: auto; transform: none;';
      }

      // Vertical placement and arrow direction
      const verticalPopoverStyle = opensDownward ? 'top: 24px;' : 'bottom: 24px;';
      const arrowVerticalStyle = opensDownward 
        ? 'bottom: 100%; border-bottom: 7px solid #0f172a; border-top: none;'
        : 'top: 100%; border-top: 7px solid #0f172a; border-bottom: none;';

      // Inner HTML: Pin marker + Attached Popover
      pinWrapper.innerHTML = `
        <div style="position: relative;">
          <!-- Pin Circle -->
          <div id="pin-btn-${c.id}" style="
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
            cursor: pointer;
            transform: translate(-50%, -50%) ${isSelected ? 'scale(1.2)' : 'scale(1)'};
            ${isSelected ? 'outline: 3px solid #0D45FC; outline-offset: 2px;' : ''}
            transition: transform 0.15s ease;
          ">
            ${isResolved ? '✓' : index + 1}
          </div>

          <!-- Popover Attached Directly Next to Pin -->
          ${isSelected ? `
            <div id="popover-${c.id}" style="
              position: absolute;
              ${verticalPopoverStyle}
              ${horizontalPopoverStyle}
              width: 300px;
              background: #0f172a;
              color: white;
              padding: 12px 14px;
              border-radius: 16px;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
              border: 1px solid #334155;
              font-family: system-ui, -apple-system, sans-serif;
              z-index: 1000001;
              cursor: default;
            ">
              <!-- Popover Header -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #1e293b;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 9999px; background: ${isResolved ? '#059669' : '#0D45FC'}; color: white; font-family: monospace; font-size: 10px; font-weight: bold;">
                    ${isResolved ? '✓' : index + 1}
                  </span>
                  <span style="font-size: 12px; font-weight: 700; color: #f8fafc;">${escapeHtml(c.author)}</span>
                  <span style="font-size: 10px; color: #64748b;">${formatShortDate(c.createdAt)}</span>
                </div>
                <button id="close-pop-${c.id}" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; line-height: 1; padding: 2px;">✕</button>
              </div>

              <!-- Main Comment Message -->
              <p style="font-size: 12px; line-height: 1.5; color: ${isResolved ? '#94a3b8' : '#e2e8f0'}; margin: 0 0 10px 0; ${isResolved ? 'text-decoration: line-through;' : ''} word-break: break-word;">
                ${escapeHtml(c.text)}
              </p>

              <!-- Replies List (if any) -->
              ${replies.length > 0 ? `
                <div style="margin: 8px 0; max-height: 130px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 2px;">
                  ${replies.map(r => `
                    <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 6px 8px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                        <span style="font-size: 10px; font-weight: 700; color: #60a5fa;">${escapeHtml(r.author)}</span>
                        <div style="display: flex; align-items: center; gap: 4px;">
                          <span style="font-size: 9px; color: #64748b;">${formatShortDate(r.createdAt)}</span>
                          <button id="del-reply-${c.id}-${r.id}" style="background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 10px; padding: 1px 3px;" title="Delete reply">✕</button>
                        </div>
                      </div>
                      <p style="font-size: 11px; color: #cbd5e1; margin: 0; line-height: 1.4; word-break: break-word;">${escapeHtml(r.text)}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Inline Reply Input Box -->
              <div style="display: flex; gap: 4px; margin-top: 8px; margin-bottom: 10px;">
                <input 
                  id="reply-input-${c.id}" 
                  type="text" 
                  placeholder="პასუხის დაწერა (Reply)..." 
                  style="
                    flex: 1; 
                    padding: 6px 9px; 
                    font-size: 11px; 
                    border-radius: 8px; 
                    background: #1e293b; 
                    border: 1px solid #475569; 
                    color: white; 
                    outline: none;
                  " 
                />
                <button 
                  id="reply-btn-${c.id}" 
                  style="
                    background: #0D45FC; 
                    color: white; 
                    border: none; 
                    border-radius: 8px; 
                    padding: 5px 10px; 
                    font-size: 11px; 
                    font-weight: 600; 
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
                >
                  Send
                </button>
              </div>

              <!-- Popover Actions: Resolve & Delete -->
              <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #1e293b;">
                <button id="toggle-resolve-${c.id}" style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  padding: 4px 10px;
                  border-radius: 8px;
                  font-size: 11px;
                  font-weight: 600;
                  border: none;
                  cursor: pointer;
                  background: ${isResolved ? 'rgba(5, 150, 105, 0.2)' : '#1e293b'};
                  color: ${isResolved ? '#34d399' : '#cbd5e1'};
                ">
                  ✓ ${isResolved ? 'Resolved' : 'Resolve'}
                </button>

                <button id="del-comment-${c.id}" style="
                  background: transparent;
                  border: none;
                  color: #94a3b8;
                  cursor: pointer;
                  padding: 4px;
                  font-size: 13px;
                " title="Delete comment">
                  🗑
                </button>
              </div>

              <!-- Teardrop Arrow (flips automatically!) -->
              <div style="
                position: absolute;
                ${arrowVerticalStyle}
                ${arrowHorizontalStyle}
                width: 0;
                height: 0;
                border-left: 7px solid transparent;
                border-right: 7px solid transparent;
              "></div>
            </div>
          ` : ''}
        </div>
      `;

      // Event Listeners inside iframe for Popover elements
      const pinBtn = pinWrapper.querySelector(`#pin-btn-${c.id}`) as HTMLElement;
      if (pinBtn) {
        pinBtn.onclick = (e) => {
          e.stopPropagation();
          setActivePinId(isSelected ? null : c.id);
          setDraftComment(null);
        };
      }

      if (isSelected) {
        const popoverEl = pinWrapper.querySelector(`#popover-${c.id}`) as HTMLElement;
        if (popoverEl) {
          popoverEl.onclick = (e) => e.stopPropagation();
        }

        const closeBtn = pinWrapper.querySelector(`#close-pop-${c.id}`) as HTMLElement;
        if (closeBtn) {
          closeBtn.onclick = (e) => {
            e.stopPropagation();
            setActivePinId(null);
          };
        }

        const resolveBtn = pinWrapper.querySelector(`#toggle-resolve-${c.id}`) as HTMLElement;
        if (resolveBtn) {
          resolveBtn.onclick = (e) => {
            e.stopPropagation();
            handleToggleResolve(c.id);
          };
        }

        const delBtn = pinWrapper.querySelector(`#del-comment-${c.id}`) as HTMLElement;
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.stopPropagation();
            handleDeleteComment(c.id);
          };
        }

        // Reply submission inside popover
        const replyInput = pinWrapper.querySelector(`#reply-input-${c.id}`) as HTMLInputElement;
        const replyBtn = pinWrapper.querySelector(`#reply-btn-${c.id}`) as HTMLButtonElement;

        const submitReply = () => {
          if (!replyInput) return;
          const text = replyInput.value.trim();
          if (!text) return;
          handleAddReplyToComment(c.id, text);
          replyInput.value = '';
        };

        if (replyInput) {
          replyInput.onclick = (e) => e.stopPropagation();
          replyInput.onkeydown = (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              e.preventDefault();
              submitReply();
            }
          };
        }

        if (replyBtn) {
          replyBtn.onclick = (e) => {
            e.stopPropagation();
            submitReply();
          };
        }

        // Delete reply buttons inside popover
        replies.forEach(r => {
          const delRepBtn = pinWrapper.querySelector(`#del-reply-${c.id}-${r.id}`) as HTMLElement;
          if (delRepBtn) {
            delRepBtn.onclick = (e) => {
              e.stopPropagation();
              handleDeleteReplyFromComment(c.id, r.id);
            };
          }
        });
      }

      pinContainer?.appendChild(pinWrapper);
    });

  }, [toolMode, pageComments, activePinId, handleAddReplyToComment, handleDeleteReplyFromComment]);

  // Attach click listener to iframe document for dropping comments
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const handleIframeClick = (e: MouseEvent) => {
        if (toolMode !== 'comment') {
          // If clicked outside pin in select mode, close active popover
          const target = e.target as HTMLElement;
          if (!target.closest('#debitinfo-pins-container')) {
            setActivePinId(null);
          }
          return;
        }

        // Ensure user entered their name
        const currentName = getUserName();
        if (!currentName) {
          setIsNameModalOpen(true);
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const scrollW = doc.documentElement.scrollWidth || doc.body.scrollHeight;
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

  // Post Draft Comment to Cloud Database
  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draftText.trim() || !draftComment) return;

    const author = userName.trim() || 'Reviewer';
    const { updated, newComment } = addComment(comments, {
      pageId: selectedPageId,
      author,
      text: draftText.trim(),
      x: draftComment.x,
      y: draftComment.y,
    });

    setComments(updated);
    setDraftComment(null);
    setDraftText('');
    setToolMode('select');
    setActivePinId(newComment.id);
  };

  // Submit Sidebar Reply
  const handleSidebarReplySubmit = (commentId: string) => {
    if (!sidebarReplyText.trim()) return;
    handleAddReplyToComment(commentId, sidebarReplyText.trim());
    setSidebarReplyText('');
    setReplyingToId(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      
      {/* 1. Left Sidebar: Page List & Comments */}
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
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="text-slate-400 text-[10px] block leading-none">Reviewer:</span>
                  <span className="font-semibold text-white truncate">
                    {userName || 'Click to set name...'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setTempName(userName);
                  setIsNameModalOpen(true);
                }}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                title="Edit Name"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
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
                <div className="space-y-2 mt-1.5">
                  {pageComments.map((comment, index) => {
                    const isSelected = activePinId === comment.id;
                    const replies = Array.isArray(comment.replies) ? comment.replies : [];
                    const isReplying = replyingToId === comment.id;

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
                                handleToggleResolve(comment.id);
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
                                handleDeleteComment(comment.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700"
                              title="Delete Comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Comment body */}
                        <p className={`text-[11px] leading-relaxed ${comment.resolved ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {comment.text}
                        </p>

                        {/* Thread Replies in Sidebar */}
                        {replies.length > 0 && (
                          <div className="mt-2 pl-2 border-l-2 border-blue-500/40 space-y-1.5">
                            {replies.map(r => (
                              <div key={r.id} className="text-[10px] bg-slate-950/60 rounded-lg p-2 border border-slate-800">
                                <div className="flex items-center justify-between text-blue-400 font-semibold mb-0.5">
                                  <span>{r.author}</span>
                                  <span className="text-slate-500 font-normal text-[9px]">{formatShortDate(r.createdAt)}</span>
                                </div>
                                <p className="text-slate-300 leading-snug">{r.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Sidebar Reply Trigger & Input */}
                        <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingToId(isReplying ? null : comment.id);
                              setSidebarReplyText('');
                            }}
                            className="inline-flex items-center gap-1 hover:text-blue-400 transition-colors"
                          >
                            <CornerDownRight className="w-3 h-3" />
                            <span>{replies.length > 0 ? `${replies.length} პასუხი` : 'Reply'}</span>
                          </button>
                          <span className="text-slate-500 text-[9px]">{formatShortDate(comment.createdAt)}</span>
                        </div>

                        {isReplying && (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="mt-2 pt-2 border-t border-slate-700 flex gap-1.5 animate-in fade-in"
                          >
                            <input
                              type="text"
                              autoFocus
                              value={sidebarReplyText}
                              onChange={(e) => setSidebarReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSidebarReplySubmit(comment.id);
                                }
                              }}
                              placeholder="დაწერეთ პასუხი..."
                              className="flex-1 px-2 py-1 text-[11px] rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => handleSidebarReplySubmit(comment.id)}
                              disabled={!sidebarReplyText.trim()}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold disabled:opacity-50"
                            >
                              Send
                            </button>
                          </div>
                        )}

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

      {/* 2. Main Viewport & Floating Toolbar at the Middle Bottom */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-slate-950">
        
        {/* Viewport Frame Container */}
        <div ref={containerRef} className="flex-1 relative w-full h-full bg-white">
          <iframe
            ref={iframeRef}
            src={currentPage.htmlPath}
            title={currentPage.titleKa}
            className="w-full h-full border-0"
          />

          {/* New Comment Draft Popover at Click Coordinates (with smart boundary detection!) */}
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

              {/* Popover Form (flips downward if click is near top of screen!) */}
              <form
                onSubmit={handlePostComment}
                className={`absolute left-1/2 -translate-x-1/2 ${
                  draftComment.screenY < 260 ? 'top-full mt-2' : 'bottom-full mb-2'
                } w-72 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-left`}
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
        </div>

        {/* Floating Figma-style Toolbar MOVED TO MIDDLE-BOTTOM */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 rounded-full bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md">
          
          {/* Select Tool (V) */}
          <button
            onClick={() => {
              setToolMode('select');
              setDraftComment(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
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
            onClick={handleActivateCommentMode}
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

        {/* Comment Tool Guidance Banner (above the bottom toolbar) */}
        {toolMode === 'comment' && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-blue-600/95 text-white text-xs shadow-xl backdrop-blur-md flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>დააწკაპუნეთ ნებისმიერ ადგილზე შენიშვნის დასატოვებლად (Esc გამოსასვლელად)</span>
          </div>
        )}

      </main>

      {/* 3. Obvious Name Input Modal */}
      {isNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-white text-left animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">შეიყვანეთ თქვენი სახელი</h3>
                <p className="text-xs text-slate-400">Please enter your name</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              შენიშვნების დასატოვებლად გთხოვთ მიუთითოთ თქვენი სახელი ან როლი, რათა სხვებმა იცოდნენ ვის ეკუთვნის კომენტარი:
            </p>

            <form onSubmit={handleSaveNameModal} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="მაგ: გიორგი, დიზაინერი, კლიენტი..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {userName && (
                  <button
                    type="button"
                    onClick={() => setIsNameModalOpen(false)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    გაუქმება
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!tempName.trim()}
                  className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  გაგრძელება / Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
