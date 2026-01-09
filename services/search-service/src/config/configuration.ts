/**
 * Search Service Configuration
 * Enterprise-grade configuration for search and discovery
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'search-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4016', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'search_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  elasticsearch: {
    nodes: (process.env.ELASTICSEARCH_NODES || 'http://stage3-elasticsearch:9200').split(','),
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
    apiKey: process.env.ELASTICSEARCH_API_KEY || '',
    cloudId: process.env.ELASTICSEARCH_CLOUD_ID || '',
    indices: {
      caregivers: process.env.ES_INDEX_CAREGIVERS || 'caregivers',
      patients: process.env.ES_INDEX_PATIENTS || 'patients',
      agencies: process.env.ES_INDEX_AGENCIES || 'agencies',
      visits: process.env.ES_INDEX_VISITS || 'visits',
      documents: process.env.ES_INDEX_DOCUMENTS || 'documents',
    },
    maxResultWindow: parseInt(process.env.ES_MAX_RESULT_WINDOW || '10000', 10),
  },
  redis: {
    host: process.env.REDIS_HOST || 'stage3-redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    cacheTtlSeconds: parseInt(process.env.SEARCH_CACHE_TTL || '300', 10),
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'stage3-kafka:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'search-service',
    groupId: process.env.KAFKA_GROUP_ID || 'search-group',
    topics: {
      indexUpdates: process.env.KAFKA_TOPIC_INDEX_UPDATES || 'search.index.updates',
      searchEvents: process.env.KAFKA_TOPIC_SEARCH_EVENTS || 'search.events',
    },
  },
  search: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
    fuzzyEnabled: (process.env.FUZZY_SEARCH_ENABLED || 'true').toLowerCase() === 'true',
    fuzzyMaxEdits: parseInt(process.env.FUZZY_MAX_EDITS || '2', 10),
    highlightEnabled: (process.env.HIGHLIGHT_ENABLED || 'true').toLowerCase() === 'true',
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,matching-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});
