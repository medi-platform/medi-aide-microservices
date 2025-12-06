export default () => ({
  service: {
    name: process.env.SERVICE_NAME || 'training-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: parseInt(process.env.SERVICE_PORT || '4024', 10),
  },
  lms: {
    baseUrl: process.env.LMS_BASE_URL || '',
    apiEnabled: (process.env.LMS_API_ENABLED || 'false').toLowerCase() === 'true',
    apiKey: process.env.LMS_API_KEY || '',
    branchIds: (process.env.LMS_BRANCH_IDS || '').split(',').map((s) => s.trim()).filter(Boolean),
  },
});


