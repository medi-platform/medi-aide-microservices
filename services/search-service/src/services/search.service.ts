import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SearchHistory } from '../entities/search-history.entity';
import { SavedSearch } from '../entities/saved-search.entity';
import { ElasticsearchService } from './elasticsearch.service';
import {
  SearchIndex,
  SearchQuery,
  SearchResult,
  GeoSearchParams,
  AutocompleteResult,
  IndexDocument,
} from '../interfaces/search.interface';

/**
 * Search Service
 * Business logic for search operations
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(SearchHistory)
    private readonly historyRepo: Repository<SearchHistory>,
    @InjectRepository(SavedSearch)
    private readonly savedSearchRepo: Repository<SavedSearch>,
    private readonly esService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Execute a search query
   */
  async search<T>(
    query: SearchQuery,
    userId?: string,
    sessionId?: string,
  ): Promise<SearchResult<T>> {
    const startTime = Date.now();

    const result = await this.esService.search<T>(query);

    // Log search history
    if (query.query) {
      await this.logSearch(
        query,
        result.total,
        Date.now() - startTime,
        userId,
        sessionId,
      );
    }

    return result;
  }

  /**
   * Search for caregivers
   */
  async searchCaregivers<T>(
    queryString: string,
    filters?: Record<string, unknown>,
    page?: number,
    pageSize?: number,
    userId?: string,
  ): Promise<SearchResult<T>> {
    const query: SearchQuery = {
      query: queryString,
      index: SearchIndex.CAREGIVERS,
      page,
      pageSize,
      fuzzy: true,
      highlight: true,
    };

    if (filters) {
      query.filters = Object.entries(filters).map(([field, value]) => ({
        field,
        operator: 'eq' as const,
        value,
      }));
    }

    return this.search<T>(query, userId);
  }

  /**
   * Geo search for nearby caregivers
   */
  async searchNearbyCaregivers<T>(
    params: GeoSearchParams,
    additionalFilters?: Record<string, unknown>,
    userId?: string,
  ): Promise<SearchResult<T>> {
    return this.esService.geoSearch<T>(SearchIndex.CAREGIVERS, params, additionalFilters);
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(
    index: SearchIndex,
    prefix: string,
    field?: string,
  ): Promise<AutocompleteResult> {
    return this.esService.autocomplete(index, prefix, field);
  }

  /**
   * Index a document
   */
  async indexDocument(doc: IndexDocument): Promise<void> {
    await this.esService.indexDocument(doc);
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(documents: IndexDocument[]): Promise<{ indexed: number; errors: number }> {
    const result = await this.esService.bulkIndex(documents);
    return { indexed: result.indexed, errors: result.errors };
  }

  /**
   * Delete a document from index
   */
  async deleteFromIndex(index: SearchIndex, id: string): Promise<void> {
    await this.esService.deleteDocument(index, id);
  }

  /**
   * Save a search for a user
   */
  async saveSearch(
    userId: string,
    name: string,
    query: SearchQuery,
    description?: string,
    sendNotifications?: boolean,
    notificationFrequency?: 'instant' | 'daily' | 'weekly',
  ): Promise<SavedSearch> {
    const savedSearch = this.savedSearchRepo.create({
      userId,
      name,
      description,
      query: query.query,
      index: query.index,
      filters: query.filters as Record<string, unknown>,
      sort: query.sort as unknown as Record<string, unknown>,
      sendNotifications: sendNotifications || false,
      notificationFrequency,
    });

    return this.savedSearchRepo.save(savedSearch);
  }

  /**
   * Get user's saved searches
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    return this.savedSearchRepo.find({
      where: { userId, isActive: true },
      order: { lastUsedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Execute a saved search
   */
  async executeSavedSearch<T>(savedSearchId: string, userId: string): Promise<SearchResult<T>> {
    const savedSearch = await this.savedSearchRepo.findOne({
      where: { id: savedSearchId, userId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    // Update usage stats
    savedSearch.useCount++;
    savedSearch.lastUsedAt = new Date();
    await this.savedSearchRepo.save(savedSearch);

    const query: SearchQuery = {
      query: savedSearch.query,
      index: savedSearch.index,
      filters: savedSearch.filters as SearchQuery['filters'],
      sort: savedSearch.sort as SearchQuery['sort'],
    };

    return this.search<T>(query, userId);
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(savedSearchId: string, userId: string): Promise<void> {
    const savedSearch = await this.savedSearchRepo.findOne({
      where: { id: savedSearchId, userId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    savedSearch.isActive = false;
    await this.savedSearchRepo.save(savedSearch);
  }

  /**
   * Get search history for a user
   */
  async getSearchHistory(userId: string, limit: number = 20): Promise<SearchHistory[]> {
    return this.historyRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(index?: SearchIndex, limit: number = 10): Promise<string[]> {
    const query = this.historyRepo
      .createQueryBuilder('h')
      .select('h.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .where('h.createdAt > :since', { since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) });

    if (index) {
      query.andWhere('h.index = :index', { index });
    }

    const results = await query
      .groupBy('h.query')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => r.query);
  }

  /**
   * Log a search query
   */
  private async logSearch(
    query: SearchQuery,
    resultCount: number,
    durationMs: number,
    userId?: string,
    sessionId?: string,
  ): Promise<void> {
    const history = this.historyRepo.create({
      userId,
      query: query.query,
      index: query.index,
      filters: query.filters as Record<string, unknown>,
      resultCount,
      durationMs,
      sessionId,
    });

    await this.historyRepo.save(history);
  }
}
