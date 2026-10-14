export type PageCategory = 
  | 'All'
  | 'Landing & Public'
  | 'Client Portals'
  | 'Analytics & Operations'
  | 'Legal & Enforcement'
  | 'CRM & Field Ops';

export interface PageDemo {
  id: string;
  slug: string;
  titleKa: string;
  titleEn: string;
  category: PageCategory;
  roleBadge: string;
  descriptionKa: string;
  descriptionEn: string;
  keyFeatures: string[];
  htmlPath: string;
  thumbnailPath: string;
  order: number;
}

export type CommentCategory = 'design' | 'copy' | 'functionality' | 'bug' | 'suggestion';
export type CommentPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CommentStatus = 'open' | 'resolved';

export interface CommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CommentPin {
  id: string;
  pageId: string;
  number: number;
  // Percentage coordinates (0-100) relative to the iframe page viewport
  x?: number | null;
  y?: number | null;
  author: string;
  text: string;
  category: CommentCategory;
  priority: CommentPriority;
  status: CommentStatus;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  replies: CommentReply[];
}

export type ViewportDevice = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'full';

export interface ViewportConfig {
  id: ViewportDevice;
  label: string;
  width: string;
  icon: string;
}
