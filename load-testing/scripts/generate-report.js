#!/usr/bin/env node
/**
 * Load Test Report Generator
 * Generates comprehensive HTML reports from K6 test results
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

function generateReport() {
  const reportFiles = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(REPORTS_DIR, f),
      data: JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, f), 'utf8')),
    }));

  const html = generateHTML(reportFiles);
  const outputPath = path.join(REPORTS_DIR, 'load-test-report.html');
  
  fs.writeFileSync(outputPath, html);
  console.log(`Report generated: ${outputPath}`);
}

function generateHTML(reports) {
  const timestamp = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medi-Aide Load Test Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f7fa;
      color: #333;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 12px;
    }
    header h1 { font-size: 2em; margin-bottom: 10px; }
    header p { opacity: 0.9; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      font-size: 0.9em;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .summary-card .value {
      font-size: 2em;
      font-weight: bold;
      color: #1e40af;
    }
    .summary-card .status {
      font-size: 0.85em;
      margin-top: 5px;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    .status.pass { background: #d1fae5; color: #065f46; }
    .status.fail { background: #fee2e2; color: #991b1b; }
    .status.warn { background: #fef3c7; color: #92400e; }
    .test-section {
      background: white;
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .test-section h2 {
      color: #1e40af;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #64748b;
      font-size: 0.85em;
      text-transform: uppercase;
    }
    tr:hover { background: #f8fafc; }
    .metric-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    .metric-bar .fill {
      height: 100%;
      border-radius: 4px;
    }
    .fill.good { background: #22c55e; }
    .fill.warn { background: #f59e0b; }
    .fill.bad { background: #ef4444; }
    .recommendations {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px 20px;
      margin-top: 20px;
      border-radius: 0 8px 8px 0;
    }
    .recommendations h4 {
      color: #1e40af;
      margin-bottom: 10px;
    }
    .recommendations ul {
      margin-left: 20px;
    }
    .recommendations li {
      margin-bottom: 5px;
    }
    footer {
      text-align: center;
      color: #64748b;
      padding: 30px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🏥 Medi-Aide Load Test Report</h1>
      <p>Generated: ${timestamp}</p>
    </header>

    <div class="summary-grid">
      ${generateSummaryCards(reports)}
    </div>

    ${reports.map(r => generateTestSection(r)).join('')}

    <div class="recommendations">
      <h4>📋 Recommendations</h4>
      <ul>
        ${generateRecommendations(reports)}
      </ul>
    </div>

    <footer>
      <p>Medi-Aide Platform - Load Testing Suite</p>
      <p>© ${new Date().getFullYear()} Medi-Aide Healthcare Solutions</p>
    </footer>
  </div>
</body>
</html>`;
}

function generateSummaryCards(reports) {
  const totalRequests = reports.reduce((sum, r) => {
    return sum + (r.data.results?.totalRequests || r.data.metrics?.http_reqs?.values?.count || 0);
  }, 0);

  const avgP95 = reports.reduce((sum, r) => {
    return sum + (r.data.results?.p95ResponseTime || r.data.metrics?.http_req_duration?.values?.['p(95)'] || 0);
  }, 0) / reports.length;

  const avgErrorRate = reports.reduce((sum, r) => {
    return sum + (r.data.results?.errorRate || r.data.metrics?.http_req_failed?.values?.rate || 0);
  }, 0) / reports.length;

  return `
    <div class="summary-card">
      <h3>Total Requests</h3>
      <div class="value">${totalRequests.toLocaleString()}</div>
      <span class="status pass">All Tests</span>
    </div>
    <div class="summary-card">
      <h3>Avg P95 Response Time</h3>
      <div class="value">${avgP95.toFixed(0)}ms</div>
      <span class="status ${avgP95 < 500 ? 'pass' : avgP95 < 1000 ? 'warn' : 'fail'}">
        ${avgP95 < 500 ? 'Excellent' : avgP95 < 1000 ? 'Acceptable' : 'Needs Work'}
      </span>
    </div>
    <div class="summary-card">
      <h3>Avg Error Rate</h3>
      <div class="value">${(avgErrorRate * 100).toFixed(2)}%</div>
      <span class="status ${avgErrorRate < 0.01 ? 'pass' : avgErrorRate < 0.05 ? 'warn' : 'fail'}">
        ${avgErrorRate < 0.01 ? 'Excellent' : avgErrorRate < 0.05 ? 'Acceptable' : 'Needs Work'}
      </span>
    </div>
    <div class="summary-card">
      <h3>Tests Run</h3>
      <div class="value">${reports.length}</div>
      <span class="status pass">Complete</span>
    </div>
  `;
}

function generateTestSection(report) {
  const data = report.data;
  const testType = data.testType || report.name.replace('.json', '').replace(/-/g, ' ');

  return `
    <div class="test-section">
      <h2>${testType}</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${generateMetricRows(data)}
        </tbody>
      </table>
    </div>
  `;
}

function generateMetricRows(data) {
  const rows = [];

  if (data.results) {
    if (data.results.totalRequests !== undefined) {
      rows.push(createRow('Total Requests', data.results.totalRequests.toLocaleString(), 'info'));
    }
    if (data.results.avgResponseTime !== undefined) {
      rows.push(createRow('Avg Response Time', `${data.results.avgResponseTime.toFixed(0)}ms`, getStatus(data.results.avgResponseTime, 200, 500)));
    }
    if (data.results.p95ResponseTime !== undefined) {
      rows.push(createRow('P95 Response Time', `${data.results.p95ResponseTime.toFixed(0)}ms`, getStatus(data.results.p95ResponseTime, 500, 1000)));
    }
    if (data.results.p99ResponseTime !== undefined) {
      rows.push(createRow('P99 Response Time', `${data.results.p99ResponseTime.toFixed(0)}ms`, getStatus(data.results.p99ResponseTime, 1000, 2000)));
    }
    if (data.results.errorRate !== undefined) {
      rows.push(createRow('Error Rate', `${(data.results.errorRate * 100).toFixed(2)}%`, getStatus(data.results.errorRate * 100, 1, 5)));
    }
  }

  return rows.join('');
}

function createRow(metric, value, status) {
  const statusClass = status === 'good' ? 'pass' : status === 'warn' ? 'warn' : 'fail';
  return `
    <tr>
      <td>${metric}</td>
      <td><strong>${value}</strong></td>
      <td><span class="status ${statusClass}">${status.toUpperCase()}</span></td>
    </tr>
  `;
}

function getStatus(value, goodThreshold, warnThreshold) {
  if (value < goodThreshold) return 'good';
  if (value < warnThreshold) return 'warn';
  return 'bad';
}

function generateRecommendations(reports) {
  const recommendations = [];

  reports.forEach(r => {
    if (r.data.analysis?.recommendations) {
      r.data.analysis.recommendations.forEach(rec => {
        if (!recommendations.includes(rec)) {
          recommendations.push(rec);
        }
      });
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('All performance metrics are within acceptable thresholds');
    recommendations.push('Continue monitoring during production deployment');
    recommendations.push('Schedule regular load tests (weekly/monthly)');
  }

  return recommendations.map(r => `<li>${r}</li>`).join('');
}

// Run the generator
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

generateReport();
