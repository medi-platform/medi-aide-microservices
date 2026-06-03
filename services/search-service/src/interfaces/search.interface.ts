/**
 * Search Service Interfaces
 */

export enum SearchIndex {
  CAREGIVERS = 'caregivers',
  PATIENTS = 'patients',
  AGENCIES = 'agencies',
  VISITS = 'visits',
  DOCUMENTS = 'documents',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface SearchQuery {
  query: string;
  index: SearchIndex;
  filters?: SearchFilter[];
  sort?: SearchSort[];
  page?: number;
  pageSize?: number;
  highlight?: boolean;
  fuzzy?: boolean;
}

export interface SearchFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'range' | 'exists' | 'geo';
  value: unknown;
}

export interface SearchSort {
  field: string;
  order: SortOrder;
}

export interface SearchResult<T = unknown> {
  items: SearchHit<T>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  took: number;
  maxScore?: number;
}

export interface SearchHit<T = unknown> {
  id: string;
  score: number;
  source: T;
  highlights?: Record<string, string[]>;
}

export interface GeoSearchParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
  sort?: 'distance' | 'score';
}

export interface AutocompleteResult {
  suggestions: string[];
  completions: Array<{
    text: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
}

export interface IndexDocument {
  id: string;
  index: SearchIndex;
  document: Record<string, unknown>;
}

export interface BulkIndexResult {
  indexed: number;
  errors: number;
  items: Array<{
    id: string;
    status: 'created' | 'updated' | 'error';
    error?: string;
  }>;
}
