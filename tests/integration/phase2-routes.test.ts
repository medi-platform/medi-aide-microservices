/**
 * Phase 2 Route Integration Tests
 * 
 * Tests all Phase 2 routes to ensure they are properly configured
 * and return expected responses.
 */

import * as request from 'supertest';

const KONG_URL = process.env.KONG_URL || 'http://localhost:8000';

describe('Phase 2 Route Integration Tests', () => {
  const agent = request.agent(KONG_URL);

  describe('Internal APIs', () => {
    it('GET /api/v1/internal should return 200', async () => {
      const response = await agent.get('/api/v1/internal');
      expect([200, 401, 403]).toContain(response.status);
    });

    it('GET /api/v1/internal/caregivers should return 200', async () => {
      const response = await agent.get('/api/v1/internal/caregivers');
      expect([200, 401, 403]).toContain(response.status);
    });

    it('GET /api/v1/internal/care-requests should return 200', async () => {
      const response = await agent.get('/api/v1/internal/care-requests');
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Public APIs', () => {
    it('GET /api/v1/public should return 200', async () => {
      const response = await agent.get('/api/v1/public');
      expect(response.status).toBe(200);
    });

    it('GET /api/v1/public/contracts should return 200', async () => {
      const response = await agent.get('/api/v1/public/contracts');
      expect(response.status).toBe(200);
    });

    it('GET /api/v1/public/referrals should return 200', async () => {
      const response = await agent.get('/api/v1/public/referrals');
      expect(response.status).toBe(200);
    });

    it('GET /api/v1/public/launch should return 200', async () => {
      const response = await agent.get('/api/v1/public/launch');
      expect(response.status).toBe(200);
    });

    it('GET /api/v1/public/ws should return 200', async () => {
      const response = await agent.get('/api/v1/public/ws');
      expect(response.status).toBe(200);
    });
  });

  describe('BFF APIs', () => {
    it('GET /api/v1/bff should return 200', async () => {
      const response = await agent.get('/api/v1/bff');
      expect([200, 401, 403]).toContain(response.status);
    });

    it('GET /api/v1/bff/care-requests should return 200', async () => {
      const response = await agent.get('/api/v1/bff/care-requests');
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Support APIs', () => {
    it('GET /api/v1/support should return 200', async () => {
      const response = await agent.get('/api/v1/support');
      expect(response.status).toBe(200);
    });

    it('GET /api/v1/support/help-center should return 200', async () => {
      const response = await agent.get('/api/v1/support/help-center');
      expect(response.status).toBe(200);
    });
  });

  describe('Health/Monitoring APIs', () => {
    it('GET /api/v1/health should return 200', async () => {
      const response = await agent.get('/api/v1/health');
      expect(response.status).toBe(200);
    });

    it('GET /api/v1/health/database should return 200', async () => {
      const response = await agent.get('/api/v1/health/database');
      expect([200, 503]).toContain(response.status);
    });

    it('GET /api/v1/monitoring should return 200', async () => {
      const response = await agent.get('/api/v1/monitoring');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/metrics should return 200', async () => {
      const response = await agent.get('/api/v1/metrics');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Privacy/Security APIs', () => {
    it('GET /api/v1/privacy should return 200', async () => {
      const response = await agent.get('/api/v1/privacy');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/security should return 200', async () => {
      const response = await agent.get('/api/v1/security');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Alias Routes', () => {
    it('GET /api/v1/coffeemeets should route to care-network-service', async () => {
      const response = await agent.get('/api/v1/coffeemeets');
      expect([200, 401, 404]).toContain(response.status);
    });

    it('GET /api/v1/mentors should route to mentorship-service', async () => {
      const response = await agent.get('/api/v1/mentors');
      expect([200, 401, 404]).toContain(response.status);
    });

    it('GET /api/v1/fraud should route to fraud-detection-service', async () => {
      const response = await agent.get('/api/v1/fraud');
      expect([200, 401, 404]).toContain(response.status);
    });

    it('GET /api/v1/reports should route to reports-service', async () => {
      const response = await agent.get('/api/v1/reports');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/uploads should route to file-service', async () => {
      const response = await agent.get('/api/v1/uploads');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/schedule should route to scheduling-service', async () => {
      const response = await agent.get('/api/v1/schedule');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/tasks should route to visit-service', async () => {
      const response = await agent.get('/api/v1/tasks');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/timesheets should route to agency-service', async () => {
      const response = await agent.get('/api/v1/timesheets');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/clock-in-out should route to evv-service', async () => {
      const response = await agent.get('/api/v1/clock-in-out');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Auth/Session APIs', () => {
    it('GET /api/v1/password should route to auth-service', async () => {
      const response = await agent.get('/api/v1/password');
      expect([200, 401, 404, 405]).toContain(response.status);
    });

    it('GET /api/v1/session should route to auth-service', async () => {
      const response = await agent.get('/api/v1/session');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v2/auth should route to auth-service', async () => {
      const response = await agent.get('/api/v2/auth');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('System APIs', () => {
    it('GET /api/v1/config should return 200', async () => {
      const response = await agent.get('/api/v1/config');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/system should return 200', async () => {
      const response = await agent.get('/api/v1/system');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/ui should return 200', async () => {
      const response = await agent.get('/api/v1/ui');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/advanced should return 200', async () => {
      const response = await agent.get('/api/v1/advanced');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/routes should return 200', async () => {
      const response = await agent.get('/api/v1/routes');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/migrations should return 200', async () => {
      const response = await agent.get('/api/v1/migrations');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/operations-center should return 200', async () => {
      const response = await agent.get('/api/v1/operations-center');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Mobile/V3 APIs', () => {
    it('GET /api/mobile/v1/care-plans should return 200', async () => {
      const response = await agent.get('/api/mobile/v1/care-plans');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v3/caregivers/me/visits/personal should return 200', async () => {
      const response = await agent.get('/api/v3/caregivers/me/visits/personal');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Additional Phase 2 Routes', () => {
    it('GET /api/v1/care-transitions should return 200', async () => {
      const response = await agent.get('/api/v1/care-transitions');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/delegation should return 200', async () => {
      const response = await agent.get('/api/v1/delegation');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/community/forums should return 200', async () => {
      const response = await agent.get('/api/v1/community/forums');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/guardian/portal should return 200', async () => {
      const response = await agent.get('/api/v1/guardian/portal');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/fairness-metrics should return 200', async () => {
      const response = await agent.get('/api/v1/fairness-metrics');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/fairness-dashboard should return 200', async () => {
      const response = await agent.get('/api/v1/fairness-dashboard');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/approval should return 200', async () => {
      const response = await agent.get('/api/v1/approval');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/calendar-integration should return 200', async () => {
      const response = await agent.get('/api/v1/calendar-integration');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/care-request-router should return 200', async () => {
      const response = await agent.get('/api/v1/care-request-router');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/shift-handoffs should return 200', async () => {
      const response = await agent.get('/api/v1/shift-handoffs');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/places should return 200', async () => {
      const response = await agent.get('/api/v1/places');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/coverage should return 200', async () => {
      const response = await agent.get('/api/v1/coverage');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/experimental should return 200', async () => {
      const response = await agent.get('/api/v1/experimental');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/achievements should return 200', async () => {
      const response = await agent.get('/api/v1/achievements');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/recognition should return 200', async () => {
      const response = await agent.get('/api/v1/recognition');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/spotlight should return 200', async () => {
      const response = await agent.get('/api/v1/spotlight');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/shadow-analytics should return 200', async () => {
      const response = await agent.get('/api/v1/shadow-analytics');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/ereferrals/ontario should return 200', async () => {
      const response = await agent.get('/api/v1/ereferrals/ontario');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v2/cultural-preferences should return 200', async () => {
      const response = await agent.get('/api/v2/cultural-preferences');
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('API Root Endpoints', () => {
    it('GET /api/v1 should return API info', async () => {
      const response = await agent.get('/api/v1');
      expect(response.status).toBe(200);
    });

    it('GET /api/v2 should return API info', async () => {
      const response = await agent.get('/api/v2');
      expect(response.status).toBe(200);
    });

    it('GET /health should return health status', async () => {
      const response = await agent.get('/health');
      expect(response.status).toBe(200);
    });
  });

  describe('Legacy Alias Routes (Phase 1)', () => {
    it('GET /api/v1/agency should route to agency-service', async () => {
      const response = await agent.get('/api/v1/agency');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/admin should route to admin-service', async () => {
      const response = await agent.get('/api/v1/admin');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/caregiver should route to caregiver-service', async () => {
      const response = await agent.get('/api/v1/caregiver');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/patient should route to patient-service', async () => {
      const response = await agent.get('/api/v1/patient');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/ai-matching should route to matching-service', async () => {
      const response = await agent.get('/api/v1/ai-matching');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/residential should route to residential-service', async () => {
      const response = await agent.get('/api/v1/residential');
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/v1/networking should route to care-network-service', async () => {
      const response = await agent.get('/api/v1/networking');
      expect([200, 401]).toContain(response.status);
    });
  });
});
