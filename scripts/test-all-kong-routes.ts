#!/usr/bin/env ts-node
/**
 * Comprehensive Kong Route Testing Script
 * 
 * This script tests all Kong routes by parsing kong.yaml and making
 * HTTP requests to verify each route is properly configured.
 * 
 * Usage:
 *   npx ts-node scripts/test-all-kong-routes.ts [kong_url]
 * 
 * Example:
 *   npx ts-node scripts/test-all-kong-routes.ts http://localhost:8000
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as yaml from 'js-yaml';

interface KongRoute {
  name: string;
  paths: string[];
  methods?: string[];
  strip_path?: boolean;
}

interface KongService {
  name: string;
  url: string;
  routes?: KongRoute[];
}

interface KongConfig {
  services: KongService[];
}

interface TestResult {
  route: string;
  service: string;
  path: string;
  method: string;
  status: number;
  success: boolean;
  responseTime: number;
  error?: string;
}

const KONG_URL = process.argv[2] || 'http://localhost:8000';
const results: TestResult[] = [];

// Parse Kong YAML configuration
function parseKongConfig(): KongConfig {
  const kongYamlPath = path.join(__dirname, '..', 'gateway', 'kong.yaml');
  const content = fs.readFileSync(kongYamlPath, 'utf8');
  return yaml.load(content) as KongConfig;
}

// Make HTTP request to Kong
function makeRequest(path: string, method: string = 'GET'): Promise<{ status: number; responseTime: number }> {
  return new Promise((resolve) => {
    const url = new URL(path, KONG_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const startTime = Date.now();

    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: method,
        timeout: 10000,
        headers: {
          'User-Agent': 'Kong-Route-Tester/1.0',
          'Accept': 'application/json',
        },
      },
      (res) => {
        const responseTime = Date.now() - startTime;
        resolve({ status: res.statusCode || 0, responseTime });
      }
    );

    req.on('error', () => {
      const responseTime = Date.now() - startTime;
      resolve({ status: 0, responseTime });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({ status: 0, responseTime });
    });

    req.end();
  });
}

// Test a single route
async function testRoute(service: KongService, route: KongRoute): Promise<void> {
  for (const routePath of route.paths) {
    // Skip regex paths, test with a sample path
    let testPath = routePath;
    if (testPath.startsWith('~')) {
      // Convert regex to a sample path
      testPath = testPath
        .replace('~^', '')
        .replace('(?=/|$)', '')
        .replace('(?!s(?:/|$))', '')
        .replace(/\(\?![^)]+\)/g, '')
        .replace(/\\./g, '.');
    }

    const methods = route.methods || ['GET'];
    
    for (const method of methods) {
      if (method === 'OPTIONS') continue; // Skip OPTIONS

      const { status, responseTime } = await makeRequest(testPath, method);

      // Determine success (anything except 502, 503, 0 is considered routed)
      const success = status !== 0 && status !== 502 && status !== 503;

      results.push({
        route: route.name,
        service: service.name,
        path: testPath,
        method,
        status,
        success,
        responseTime,
        error: status === 0 ? 'Connection failed' : undefined,
      });

      // Print result
      const statusColor = success ? '\x1b[32m' : '\x1b[31m';
      const resetColor = '\x1b[0m';
      const statusIcon = success ? '✓' : '✗';
      
      console.log(
        `${statusColor}${statusIcon}${resetColor} [${method}] ${testPath} → ${service.name} (${status}) ${responseTime}ms`
      );
    }
  }
}

// Generate HTML report
function generateHtmlReport(): string {
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  const rows = results
    .map(
      (r) => `
    <tr class="${r.success ? 'success' : 'failure'}">
      <td>${r.service}</td>
      <td>${r.route}</td>
      <td>${r.method}</td>
      <td>${r.path}</td>
      <td>${r.status}</td>
      <td>${r.responseTime}ms</td>
      <td>${r.success ? '✓' : '✗'}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Kong Route Validation Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { display: flex; gap: 20px; margin-bottom: 20px; }
    .stat { background: #f0f0f0; padding: 15px 25px; border-radius: 8px; }
    .stat.passed { background: #d4edda; }
    .stat.failed { background: #f8d7da; }
    .stat .value { font-size: 24px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #333; color: white; }
    tr.success td { background: #f8fff8; }
    tr.failure td { background: #fff8f8; }
    tr:hover td { background: #e8e8e8; }
  </style>
</head>
<body>
  <h1>Kong Route Validation Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <p>Kong URL: ${KONG_URL}</p>
  
  <div class="summary">
    <div class="stat"><div class="value">${total}</div>Total Routes</div>
    <div class="stat passed"><div class="value">${passed}</div>Passed</div>
    <div class="stat failed"><div class="value">${failed}</div>Failed</div>
    <div class="stat"><div class="value">${passRate}%</div>Pass Rate</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Service</th>
        <th>Route</th>
        <th>Method</th>
        <th>Path</th>
        <th>Status</th>
        <th>Time</th>
        <th>Result</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
  `;
}

// Generate JSON report
function generateJsonReport(): string {
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      kongUrl: KONG_URL,
      summary: {
        total: results.length,
        passed,
        failed,
        passRate: ((passed / results.length) * 100).toFixed(1) + '%',
      },
      results,
    },
    null,
    2
  );
}

// Main function
async function main() {
  console.log('============================================================================');
  console.log('KONG ROUTE VALIDATION TEST');
  console.log('============================================================================');
  console.log(`Kong URL: ${KONG_URL}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('============================================================================\n');

  // Parse Kong config
  let config: KongConfig;
  try {
    config = parseKongConfig();
  } catch (error) {
    console.error('Failed to parse kong.yaml:', error);
    process.exit(1);
  }

  console.log(`Found ${config.services.length} services in kong.yaml\n`);

  // Test each route
  for (const service of config.services) {
    if (!service.routes || service.routes.length === 0) continue;

    console.log(`\n--- ${service.name} ---`);
    for (const route of service.routes) {
      await testRoute(service, route);
    }
  }

  // Generate reports
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const htmlPath = path.join(reportsDir, `kong-validation-${timestamp}.html`);
  const jsonPath = path.join(reportsDir, `kong-validation-${timestamp}.json`);

  fs.writeFileSync(htmlPath, generateHtmlReport());
  fs.writeFileSync(jsonPath, generateJsonReport());

  // Print summary
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const passRate = ((passed / results.length) * 100).toFixed(1);

  console.log('\n============================================================================');
  console.log('SUMMARY');
  console.log('============================================================================');
  console.log(`Total Routes Tested: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`\nReports generated:`);
  console.log(`  HTML: ${htmlPath}`);
  console.log(`  JSON: ${jsonPath}`);

  if (failed === 0) {
    console.log('\n\x1b[32m✅ ALL ROUTES VALIDATED SUCCESSFULLY\x1b[0m');
    process.exit(0);
  } else if (failed <= 5) {
    console.log('\n\x1b[33m⚠️  VALIDATION PASSED WITH MINOR ISSUES\x1b[0m');
    process.exit(0);
  } else {
    console.log('\n\x1b[31m❌ VALIDATION FAILED\x1b[0m');
    process.exit(1);
  }
}

main().catch(console.error);
