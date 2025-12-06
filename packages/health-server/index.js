#!/usr/bin/env node
const http = require('http');

const PORT = process.env.PORT || 4010;
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown-service';
const ROUTE_PREFIX = process.env.SERVICE_ROUTE_PREFIX || '';

const server = http.createServer((req, res) => {
  // Handle both /health and /{route-prefix}/health
  if (req.url === '/health' || req.url === `/${ROUTE_PREFIX}/health`) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: SERVICE_NAME,
      timestamp: new Date().toISOString(),
      mode: 'health-only',
      route: ROUTE_PREFIX
    }));
  } else if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`# HELP ${SERVICE_NAME}_up Service is up\n# TYPE ${SERVICE_NAME}_up gauge\n${SERVICE_NAME}_up 1\n`);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Health-only server for ${SERVICE_NAME} listening on port ${PORT}`);
  console.log(`Health endpoints: /health and /${ROUTE_PREFIX}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
