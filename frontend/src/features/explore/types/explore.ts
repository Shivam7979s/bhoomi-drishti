import type { LucideIcon } from 'lucide-react';
import type { DocumentType } from '../../research/types/research';

export interface ExploreDomainItem {
  id: string;
  to: string;
  icon: LucideIcon;
  category: string;
  title: string;
  description: string;
  explorePoints: string[];
  ctaText: string;
  colorScheme: 'emerald' | 'blue' | 'amber' | 'indigo' | 'teal';
}

export interface ExploreSearchParams {
  query: string;
  documentType?: DocumentType | '';
  page: number;
}

export interface SampleInquiry {
  id: string;
  query: string;
  category: string;
}
