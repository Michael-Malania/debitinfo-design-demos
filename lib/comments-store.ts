export interface SimpleComment {
  id: string;
  pageId: string;
  author: string;
  text: string;
  x: number; // percentage
  y: number; // percentage
  createdAt: string;
  resolved: boolean;
}

const STORAGE_KEY = 'debitinfo_figma_comments_v2';
const USER_KEY = 'debitinfo_commenter_name';

export const INITIAL_COMMENTS: SimpleComment[] = [
  {
    id: 'c1',
    pageId: 'debitinfo.ge_1',
    author: 'Nika',
    text: 'Please adjust this CTA button color to solid brand blue.',
    x: 48,
    y: 28,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    resolved: false,
  },
  {
    id: 'c2',
    pageId: 'debitinfo.ge_2',
    author: 'Giorgi',
    text: 'Need a status filter dropdown above this table.',
    x: 62,
    y: 36,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    resolved: false,
  },
];

export function getUserName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USER_KEY) || '';
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, name.trim());
}

export function getComments(): SimpleComment[] {
  if (typeof window === 'undefined') return INITIAL_COMMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMMENTS));
      return INITIAL_COMMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_COMMENTS;
  } catch {
    return INITIAL_COMMENTS;
  }
}

export function saveComments(comments: SimpleComment[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    window.dispatchEvent(new Event('debitinfo_comments_changed'));

    // Serverless background sync
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments }),
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to save comments', err);
  }
}

export function addComment(comment: Omit<SimpleComment, 'id' | 'createdAt' | 'resolved'>): SimpleComment {
  const current = getComments();
  const newComment: SimpleComment = {
    ...comment,
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
    resolved: false,
  };
  const updated = [...current, newComment];
  saveComments(updated);
  return newComment;
}

export function toggleResolve(id: string): void {
  const current = getComments();
  const updated = current.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c);
  saveComments(updated);
}

export function deleteComment(id: string): void {
  const current = getComments();
  const updated = current.filter(c => c.id !== id);
  saveComments(updated);
}
