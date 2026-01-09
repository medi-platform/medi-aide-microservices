'use client';

import React, { useState } from 'react';

interface Service {
  name: string;
  description: string;
  port: number;
  docsUrl: string;
  tags: string[];
  status: 'production' | 'beta' | 'alpha';
}

const SERVICES: Service[] = [
  {
    name: 'Agency Service',
    description: 'Enterprise B2B agency management - onboarding, billing, compliance',
    port: 4050,
    docsUrl: '/api/agency/docs',
    tags: ['Core', 'B2B'],
    status: 'production',
  },
  {
    name: 'Caregiver Service',
    description: 'Caregiver profiles, availability, certifications, performance',
    port: 4051,
    docsUrl: '/api/caregiver/docs',
    tags: ['Core', 'Workforce'],
    status: 'production',
  },
  {
    name: 'Patient Service',
    description: 'Patient management, care plans, clinical notes, vitals',
    port: 4052,
    docsUrl: '/api/patient/docs',
    tags: ['Core', 'Clinical'],
    status: 'production',
  },
  {
    name: 'Care Request Service',
    description: 'Care request workflow and matching',
    port: 4053,
    docsUrl: '/api/care-request/docs',
    tags: ['Core', 'Workflow'],
    status: 'production',
  },
  {
    name: 'Scheduling Service',
    description: 'Schedules, shifts, recurring patterns',
    port: 4054,
    docsUrl: '/api/scheduling/docs',
    tags: ['Core', 'Operations'],
    status: 'production',
  },
  {
    name: 'Integration Service',
    description: 'External integrations - AlayaCare, WellSky, UKG',
    port: 4055,
    docsUrl: '/api/integration/docs',
    tags: ['Integration'],
    status: 'beta',
  },
  {
    name: 'Incident Service',
    description: 'Incident reporting and investigation',
    port: 4056,
    docsUrl: '/api/incident/docs',
    tags: ['Compliance', 'Safety'],
    status: 'production',
  },
  {
    name: 'Residential Service',
    description: 'Residential facility management',
    port: 4060,
    docsUrl: '/api/residential/docs',
    tags: ['Residential'],
    status: 'beta',
  },
  {
    name: 'Communication Service',
    description: 'Messaging, notifications, announcements',
    port: 4061,
    docsUrl: '/api/communication/docs',
    tags: ['Communication'],
    status: 'production',
  },
  {
    name: 'Feedback Service',
    description: 'Surveys, ratings, reviews',
    port: 4062,
    docsUrl: '/api/feedback/docs',
    tags: ['Engagement'],
    status: 'beta',
  },
  {
    name: 'Reports Service',
    description: 'Report generation and analytics',
    port: 4063,
    docsUrl: '/api/reports/docs',
    tags: ['Analytics'],
    status: 'beta',
  },
  {
    name: 'Auth Service',
    description: 'Authentication, tokens, MFA, sessions',
    port: 4001,
    docsUrl: '/api/auth/docs',
    tags: ['Security'],
    status: 'production',
  },
  {
    name: 'Audit Service',
    description: 'Audit logging and compliance',
    port: 4002,
    docsUrl: '/api/audit/docs',
    tags: ['Security', 'Compliance'],
    status: 'production',
  },
  {
    name: 'Training Service',
    description: 'Training courses and certifications',
    port: 4070,
    docsUrl: '/api/training/docs',
    tags: ['Supporting'],
    status: 'alpha',
  },
  {
    name: 'Wellness Service',
    description: 'Wellness programs and activities',
    port: 4071,
    docsUrl: '/api/wellness/docs',
    tags: ['Supporting'],
    status: 'alpha',
  },
  {
    name: 'Mentorship Service',
    description: 'Mentorship matching and management',
    port: 4072,
    docsUrl: '/api/mentorship/docs',
    tags: ['Supporting'],
    status: 'alpha',
  },
];

export default function ApiDocsPortal() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const allTags = [...new Set(SERVICES.flatMap((s) => s.tags))];

  const filteredServices = SERVICES.filter((service) => {
    const matchesFilter = filter === 'all' || service.tags.includes(filter);
    const matchesSearch =
      search === '' ||
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'production':
        return 'bg-green-100 text-green-800';
      case 'beta':
        return 'bg-yellow-100 text-yellow-800';
      case 'alpha':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Medi-Aide API Documentation</h1>
              <p className="text-slate-400 mt-1">Enterprise Healthcare Platform APIs</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/postman"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                📦 Postman Collection
              </a>
              <a
                href="/openapi"
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                📄 OpenAPI Spec
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search APIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === tag ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* API Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <a
              key={service.name}
              href={`http://localhost:${service.port}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-4">{service.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {service.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-slate-500 text-sm">:{service.port}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Quick Start Section */}
        <section className="mt-12 p-8 bg-slate-800 rounded-xl border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Authentication</h3>
              <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-green-400">{`POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}

# Response
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresIn": 3600
}`}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Using the Token</h3>
              <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-green-400">{`# Include in all requests
Authorization: Bearer <accessToken>

# For PHI access (HIPAA)
X-Access-Reason: treatment

# Example request
GET /api/v1/patients
Authorization: Bearer eyJhbG...
X-Access-Reason: treatment`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* API Gateway Info */}
        <section className="mt-8 p-6 bg-blue-900/30 rounded-xl border border-blue-800">
          <h3 className="text-lg font-semibold text-white mb-2">API Gateway</h3>
          <p className="text-slate-300 mb-4">
            All production traffic should go through the Kong API Gateway at port 8000.
          </p>
          <code className="text-blue-400">https://api.medi-aide.com → http://localhost:8000</code>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400">
          <p>Medi-Aide Healthcare Platform © 2024 | API Version 1.0.0</p>
        </div>
      </footer>
    </div>
  );
}
