export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Specification {
  label: string;
  value: string;
}

export interface ComponentItem {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  category: string;
  imageUrl: string;
  specs: Specification[];
  creatorId: string;
  rating: number;
  createdAt: string;
}

export interface Review {
  id: string;
  componentId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface AnalyzeResult {
  summary: string;
  pinout: { pin: string; name: string; description: string }[];
  specs: { label: string; value: string }[];
  applications: string[];
  isMocked?: boolean;
  warning?: string;
}

export interface ThesisChapter {
  id: string;
  userId: string;
  title: string;
  bullets: string;
  draftContent: string;
  status: 'Draft' | 'In Review' | 'Completed';
  createdAt: string;
}

export interface PlatformStat {
  id: string;
  month: string;
  ActiveUsers: number;
  ComponentScans: number;
  Queries: number;
  order: number;
}

export interface FAQItem {
  id: string;
  q: string;
  a: string;
  order: number;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  initials: string;
  order: number;
}

