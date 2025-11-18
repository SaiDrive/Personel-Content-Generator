
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserImage {
  id: string;
  name: string;
  url: string; 
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum ContentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SCHEDULED = 'scheduled',
  POSTED = 'posted',
  GENERATING = 'generating',
  ERROR = 'error',
}

export interface ContentItem {
  id: string;
  type: ContentType;
  data: string;
  prompt: string;
  status: ContentStatus;
  schedule?: string;
  errorMessage?: string;
  generationJobId?: string;
}

export interface UserContext {
    notes: string;
    links: string;
}