export interface CommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface SimpleComment {
  id: string;
  pageId: string;
  author: string;
  text: string;
  x: number; // percentage
  y: number; // percentage
  createdAt: string;
  resolved: boolean;
  replies?: CommentReply[];
}

const STORAGE_KEY = 'debitinfo_figma_comments_v2';
const USER_KEY = 'debitinfo_commenter_name';

export function getUserName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USER_KEY) || '';
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, name.trim());
}

export function getLocalComments(): SimpleComment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Fetch from Cloud Database API
export async function fetchRemoteComments(): Promise<SimpleComment[]> {
  try {
    const res = await fetch('/api/comments', { cache: 'no-store' });
    if (!res.ok) return getLocalComments();
    const data = await res.json();
    if (Array.isArray(data.comments)) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.comments));
      }
      return data.comments;
    }
    return getLocalComments();
  } catch {
    return getLocalComments();
  }
}

// Save to both LocalStorage and Cloud Database API
export async function saveComments(comments: SimpleComment[]): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    window.dispatchEvent(new Event('debitinfo_comments_changed'));
  }

  try {
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments }),
    });
  } catch (err) {
    console.error('Failed to save to cloud database', err);
  }
}

export function addComment(
  current: SimpleComment[],
  comment: Omit<SimpleComment, 'id' | 'createdAt' | 'resolved' | 'replies'>
): { updated: SimpleComment[]; newComment: SimpleComment } {
  const newComment: SimpleComment = {
    ...comment,
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
    resolved: false,
    replies: [],
  };
  const updated = [...current, newComment];
  saveComments(updated);
  return { updated, newComment };
}

export function toggleResolve(current: SimpleComment[], id: string): SimpleComment[] {
  const updated = current.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c);
  saveComments(updated);
  return updated;
}

export function deleteComment(current: SimpleComment[], id: string): SimpleComment[] {
  const updated = current.filter(c => c.id !== id);
  saveComments(updated);
  return updated;
}

export function addReply(
  current: SimpleComment[],
  commentId: string,
  reply: { author: string; text: string }
): { updated: SimpleComment[]; newReply: CommentReply } {
  const newReply: CommentReply = {
    id: 'r_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    author: reply.author.trim() || 'Reviewer',
    text: reply.text.trim(),
    createdAt: new Date().toISOString(),
  };

  const updated = current.map(c => {
    if (c.id === commentId) {
      const existingReplies = Array.isArray(c.replies) ? c.replies : [];
      return {
        ...c,
        replies: [...existingReplies, newReply],
      };
    }
    return c;
  });

  saveComments(updated);
  return { updated, newReply };
}

export function deleteReply(
  current: SimpleComment[],
  commentId: string,
  replyId: string
): SimpleComment[] {
  const updated = current.map(c => {
    if (c.id === commentId) {
      const existingReplies = Array.isArray(c.replies) ? c.replies : [];
      return {
        ...c,
        replies: existingReplies.filter(r => r.id !== replyId),
      };
    }
    return c;
  });

  saveComments(updated);
  return updated;
}
