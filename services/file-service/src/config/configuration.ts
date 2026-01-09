/**
 * File Service Configuration
 * Enterprise-grade configuration for file storage and management
 */
export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'file-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4015', 10),
  },
  database: {
    host: process.env.DB_HOST || 'stage3-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'service_user',
    password: process.env.DB_PASSWORD || 'service123',
    database: process.env.DB_DATABASE || 'file_db',
    ssl: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 's3', // 's3' | 'minio' | 'local'
    bucket: process.env.STORAGE_BUCKET || 'medi-aide-files',
    region: process.env.AWS_REGION || 'ca-central-1',
    endpoint: process.env.STORAGE_ENDPOINT || undefined, // For MinIO
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    forcePathStyle: (process.env.STORAGE_PATH_STYLE || 'false').toLowerCase() === 'true',
    presignedUrlExpiry: parseInt(process.env.PRESIGNED_URL_EXPIRY || '3600', 10),
  },
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 
      'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'
    ).split(','),
    scanForViruses: (process.env.SCAN_FOR_VIRUSES || 'true').toLowerCase() === 'true',
    virusScannerUrl: process.env.VIRUS_SCANNER_URL || '',
  },
  encryption: {
    enabled: (process.env.FILE_ENCRYPTION_ENABLED || 'true').toLowerCase() === 'true',
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    keyId: process.env.ENCRYPTION_KEY_ID || '',
  },
  retention: {
    defaultDays: parseInt(process.env.DEFAULT_RETENTION_DAYS || '2555', 10), // 7 years
    temporaryDays: parseInt(process.env.TEMP_RETENTION_DAYS || '7', 10),
  },
  serviceAuth: {
    jwtSecret: process.env.SERVICE_JWT_SECRET || 'service-secret',
    tokenExpirationSeconds: parseInt(process.env.SERVICE_TOKEN_EXPIRATION || '300', 10),
    allowedServices: (process.env.ALLOWED_SERVICES || 'api-gateway,caregiver-service,patient-service,evv-service')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
});
