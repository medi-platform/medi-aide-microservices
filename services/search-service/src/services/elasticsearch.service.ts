import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SearchIndex,
  SearchQuery,
  SearchResult,
  SearchHit,
  GeoSearchParams,
  AutocompleteResult,
  IndexDocument,
  BulkIndexResult,
} from '../interfaces/search.interface';

/**
 * Elasticsearch Service
 * Handles all Elasticsearch operations
 * 
 * Note: In production, integrate with @elastic/elasticsearch client
 */
@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly nodes: string[];
  private readonly indices: Record<string, string>;
  private readonly fuzzyEnabled: boolean;
  private readonly highlightEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.nodes = this.configService.get<string[]>('elasticsearch.nodes', ['http://localhost:9200']);
    this.indices = this.configService.get<Record<string, string>>('elasticsearch.indices', {});
    this.fuzzyEnabled = this.configService.get<boolean>('search.fuzzyEnabled', true);
    this.highlightEnabled = this.configService.get<boolean>('search.highlightEnabled', true);
  }

  async onModuleInit() {
    // Initialize Elasticsearch client
    // In production: this.client = new Client({ nodes: this.nodes, auth: {...} });
    this.logger.log('Elasticsearch service initialized');
  }

  /**
   * Execute a search query
   */
  async search<T>(query: SearchQuery): Promise<SearchResult<T>> {
    const startTime = Date.now();
    const indexName = this.getIndexName(query.index);
    const pageSize = Math.min(query.pageSize || 20, 100);
    const page = query.page || 1;
    const from = (page - 1) * pageSize;

    // Build Elasticsearch query
    const esQuery = this.buildQuery(query);

    // In production, use actual Elasticsearch client:
    // const response = await this.client.search({
    //   index: indexName,
    //   body: esQuery,
    //   from,
    //   size: pageSize,
    // });

    // Mock response for development
    const mockItems: SearchHit<T>[] = [];
    const total = 0;

    const took = Date.now() - startTime;

    return {
      items: mockItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      took,
      maxScore: mockItems.length > 0 ? mockItems[0].score : undefined,
    };
  }

  /**
   * Geo-based search (find nearby caregivers, etc.)
   */
  async geoSearch<T>(
    index: SearchIndex,
    params: GeoSearchParams,
    additionalFilters?: Record<string, unknown>,
  ): Promise<SearchResult<T>> {
    const startTime = Date.now();
    const indexName = this.getIndexName(index);

    // Build geo query
    const geoQuery = {
      bool: {
        must: [
          {
            geo_distance: {
              distance: `${params.radiusKm}km`,
              location: {
                lat: params.latitude,
                lon: params.longitude,
              },
            },
          },
        ],
        filter: additionalFilters ? [additionalFilters] : [],
      },
    };

    // Mock response
    const mockItems: SearchHit<T>[] = [];
    const took = Date.now() - startTime;

    return {
      items: mockItems,
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      took,
    };
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(
    index: SearchIndex,
    prefix: string,
    field: string = 'name',
    limit: number = 10,
  ): Promise<AutocompleteResult> {
    const indexName = this.getIndexName(index);

    // Build suggest query
    const suggestQuery = {
      suggest: {
        text: prefix,
        completion: {
          field: `${field}.suggest`,
          size: limit,
          skip_duplicates: true,
        },
      },
    };

    // Mock response
    return {
      suggestions: [],
      completions: [],
    };
  }

  /**
   * Index a single document
   */
  async indexDocument(doc: IndexDocument): Promise<void> {
    const indexName = this.getIndexName(doc.index);

    // In production:
    // await this.client.index({
    //   index: indexName,
    //   id: doc.id,
    //   body: doc.document,
    //   refresh: 'wait_for',
    // });

    this.logger.log(`Indexed document ${doc.id} in ${indexName}`);
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(documents: IndexDocument[]): Promise<BulkIndexResult> {
    if (documents.length === 0) {
      return { indexed: 0, errors: 0, items: [] };
    }

    // Build bulk operations
    const operations = documents.flatMap((doc) => [
      { index: { _index: this.getIndexName(doc.index), _id: doc.id } },
      doc.document,
    ]);

    // In production:
    // const response = await this.client.bulk({ body: operations, refresh: 'wait_for' });

    // Mock response
    const items = documents.map((doc) => ({
      id: doc.id,
      status: 'created' as const,
    }));

    return {
      indexed: documents.length,
      errors: 0,
      items,
    };
  }

  /**
   * Delete a document
   */
  async deleteDocument(index: SearchIndex, id: string): Promise<void> {
    const indexName = this.getIndexName(index);

    // In production:
    // await this.client.delete({ index: indexName, id });

    this.logger.log(`Deleted document ${id} from ${indexName}`);
  }

  /**
   * Build Elasticsearch query from SearchQuery
   */
  private buildQuery(query: SearchQuery): Record<string, unknown> {
    const must: unknown[] = [];
    const filter: unknown[] = [];

    // Main query
    if (query.query) {
      const queryClause = this.fuzzyEnabled
        ? {
            multi_match: {
              query: query.query,
              fields: ['name^3', 'description^2', 'skills', 'location'],
              fuzziness: 'AUTO',
              prefix_length: 2,
            },
          }
        : {
            multi_match: {
              query: query.query,
              fields: ['name^3', 'description^2', 'skills', 'location'],
            },
          };
      must.push(queryClause);
    }

    // Filters
    if (query.filters) {
      for (const f of query.filters) {
        filter.push(this.buildFilterClause(f));
      }
    }

    // Sort
    const sort = query.sort?.map((s) => ({ [s.field]: { order: s.order } })) || [];

    // Highlight
    const highlight = this.highlightEnabled && query.highlight
      ? {
          fields: {
            name: {},
            description: { fragment_size: 150, number_of_fragments: 3 },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        }
      : undefined;

    return {
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
      sort: sort.length > 0 ? sort : [{ _score: { order: 'desc' } }],
      highlight,
    };
  }

  /**
   * Build filter clause
   */
  private buildFilterClause(filter: { field: string; operator: string; value: unknown }): unknown {
    switch (filter.operator) {
      case 'eq':
        return { term: { [filter.field]: filter.value } };
      case 'neq':
        return { bool: { must_not: { term: { [filter.field]: filter.value } } } };
      case 'gt':
        return { range: { [filter.field]: { gt: filter.value } } };
      case 'gte':
        return { range: { [filter.field]: { gte: filter.value } } };
      case 'lt':
        return { range: { [filter.field]: { lt: filter.value } } };
      case 'lte':
        return { range: { [filter.field]: { lte: filter.value } } };
      case 'in':
        return { terms: { [filter.field]: filter.value } };
      case 'range':
        return { range: { [filter.field]: filter.value } };
      case 'exists':
        return { exists: { field: filter.field } };
      default:
        return { term: { [filter.field]: filter.value } };
    }
  }

  /**
   * Get full index name
   */
  private getIndexName(index: SearchIndex): string {
    return this.indices[index] || index;
  }
}
