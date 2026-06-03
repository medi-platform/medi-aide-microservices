/**
 * Environment configurations for load testing
 */

export const environments = {
  local: {
    baseUrl: 'http://localhost:3000',
    apiGateway: 'http://localhost:8000',
    wsUrl: 'ws://localhost:3000',
  },
  staging: {
    baseUrl: 'https://staging.medi-aide.com',
    apiGateway: 'https://api-staging.medi-aide.com',
    wsUrl: 'wss://staging.medi-aide.com',
  },
  production: {
    baseUrl: 'https://app.medi-aide.com',
    apiGateway: 'https://api.medi-aide.com',
    wsUrl: 'wss://app.medi-aide.com',
  },
};

export function getEnvironment() {
  const env = __ENV.ENVIRONMENT || 'staging';
  return environments[env] || environments.staging;
}

export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
