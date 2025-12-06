const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Mock responses
  if (req.url === '/wellness/health' || req.url === '/api/v1/wellness/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'wellness-service' }));
  } else if (req.url === '/api/v1/patients/me/care-status' || req.url === '/patients/me/care-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      patientId: 'patient-123',
      careStatus: 'active',
      currentCareProvider: {
        id: 'provider-456',
        name: 'Dr. Jane Smith',
        specialty: 'Primary Care'
      },
      nextAppointment: {
        date: '2025-10-25T10:00:00Z',
        type: 'Follow-up',
        location: 'Main Clinic'
      },
      activePlans: [
        {
          id: 'plan-789',
          name: 'Diabetes Management',
          status: 'in-progress',
          startDate: '2025-09-01T00:00:00Z'
        }
      ],
      lastUpdated: new Date().toISOString()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Not Found', 
      message: `Cannot ${req.method} ${req.url}`,
      statusCode: 404 
    }));
  }
});

const PORT = Number(process.env.PORT) || 4014;
server.listen(PORT, () => {
  console.log(`Mock wellness service running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  - GET /wellness/health');
  console.log('  - GET /api/v1/wellness/health');
  console.log('  - GET /api/v1/patients/me/care-status');
});

