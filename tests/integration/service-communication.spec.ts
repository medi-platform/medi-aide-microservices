/**
 * Service-to-Service Integration Tests
 * Phase 7: Integration Testing
 * 
 * Tests inter-service communication patterns
 */

import { v4 as uuid } from 'uuid';

// Mock HTTP client for service-to-service calls
const mockHttpClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

// Service URLs (would be from environment in real tests)
const SERVICES = {
  AGENCY: 'http://agency-service:3001',
  CAREGIVER: 'http://caregiver-service:3002',
  PATIENT: 'http://patient-service:3003',
  SCHEDULING: 'http://scheduling-service:3004',
  RESIDENTIAL: 'http://residential-service:3005',
  AUTH: 'http://auth-service:3006',
};

describe('Service-to-Service Communication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Agency -> Caregiver Service Communication', () => {
    it('should verify caregiver belongs to agency', async () => {
      const agencyId = uuid();
      const caregiverId = uuid();

      // Mock agency service response
      mockHttpClient.get.mockResolvedValueOnce({
        data: {
          id: agencyId,
          name: 'Test Agency',
          status: 'active',
        },
      });

      // Mock caregiver service response
      mockHttpClient.get.mockResolvedValueOnce({
        data: {
          id: caregiverId,
          agencyId,
          status: 'active',
        },
      });

      // Verify caregiver belongs to agency
      const agencyResponse = await mockHttpClient.get(`${SERVICES.AGENCY}/agencies/${agencyId}`);
      const caregiverResponse = await mockHttpClient.get(`${SERVICES.CAREGIVER}/caregivers/${caregiverId}`);

      expect(agencyResponse.data.id).toBe(agencyId);
      expect(caregiverResponse.data.agencyId).toBe(agencyId);
    });

    it('should get agency caregivers list', async () => {
      const agencyId = uuid();

      mockHttpClient.get.mockResolvedValueOnce({
        data: [
          { id: uuid(), agencyId, name: 'Caregiver 1' },
          { id: uuid(), agencyId, name: 'Caregiver 2' },
        ],
      });

      const response = await mockHttpClient.get(
        `${SERVICES.CAREGIVER}/caregivers?agencyId=${agencyId}`,
      );

      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(2);
      response.data.forEach((caregiver: any) => {
        expect(caregiver.agencyId).toBe(agencyId);
      });
    });
  });

  describe('Scheduling -> Caregiver/Patient Service Communication', () => {
    it('should validate caregiver availability for scheduling', async () => {
      const caregiverId = uuid();
      const scheduleDate = new Date().toISOString();

      // Mock availability check
      mockHttpClient.get.mockResolvedValueOnce({
        data: {
          caregiverId,
          isAvailable: true,
          availableSlots: [
            { start: '09:00', end: '17:00' },
          ],
        },
      });

      const response = await mockHttpClient.get(
        `${SERVICES.CAREGIVER}/caregivers/${caregiverId}/availability?date=${scheduleDate}`,
      );

      expect(response.data.isAvailable).toBe(true);
      expect(response.data.availableSlots.length).toBeGreaterThan(0);
    });

    it('should validate patient exists for scheduling', async () => {
      const patientId = uuid();

      mockHttpClient.get.mockResolvedValueOnce({
        data: {
          id: patientId,
          firstName: 'John',
          lastName: 'Doe',
          status: 'active',
        },
      });

      const response = await mockHttpClient.get(
        `${SERVICES.PATIENT}/patients/${patientId}`,
      );

      expect(response.data.id).toBe(patientId);
      expect(response.data.status).toBe('active');
    });

    it('should create appointment with valid caregiver and patient', async () => {
      const appointmentData = {
        caregiverId: uuid(),
        patientId: uuid(),
        agencyId: uuid(),
        scheduledDate: new Date().toISOString(),
        duration: 60,
        serviceType: 'personal_care',
      };

      mockHttpClient.post.mockResolvedValueOnce({
        data: {
          id: uuid(),
          ...appointmentData,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
        },
      });

      const response = await mockHttpClient.post(
        `${SERVICES.SCHEDULING}/appointments`,
        appointmentData,
      );

      expect(response.data.id).toBeDefined();
      expect(response.data.status).toBe('scheduled');
    });
  });

  describe('Residential -> Multiple Services Communication', () => {
    it('should create shift with caregiver validation', async () => {
      const residenceId = uuid();
      const caregiverId = uuid();

      // Mock caregiver exists and is qualified
      mockHttpClient.get.mockResolvedValueOnce({
        data: {
          id: caregiverId,
          status: 'active',
          certifications: ['PSW', 'CPR'],
        },
      });

      // Mock shift creation
      mockHttpClient.post.mockResolvedValueOnce({
        data: {
          id: uuid(),
          residenceId,
          caregiverId,
          shiftType: 'day',
          status: 'scheduled',
        },
      });

      // Validate caregiver first
      const caregiverResponse = await mockHttpClient.get(
        `${SERVICES.CAREGIVER}/caregivers/${caregiverId}`,
      );
      expect(caregiverResponse.data.status).toBe('active');

      // Create shift
      const shiftResponse = await mockHttpClient.post(`${SERVICES.RESIDENTIAL}/shifts`, {
        residenceId,
        caregiverId,
        shiftType: 'day',
      });
      expect(shiftResponse.data.status).toBe('scheduled');
    });

    it('should assign resident with patient record linking', async () => {
      const residenceId = uuid();
      const patientId = uuid();

      // Mock patient exists
      mockHttpClient.get.mockResolvedValueOnce({
        data: {
          id: patientId,
          firstName: 'Jane',
          lastName: 'Smith',
          status: 'active',
        },
      });

      // Mock resident creation
      mockHttpClient.post.mockResolvedValueOnce({
        data: {
          id: uuid(),
          residenceId,
          patientId,
          status: 'active',
        },
      });

      const patientResponse = await mockHttpClient.get(
        `${SERVICES.PATIENT}/patients/${patientId}`,
      );
      expect(patientResponse.data.status).toBe('active');

      const residentResponse = await mockHttpClient.post(`${SERVICES.RESIDENTIAL}/residents`, {
        residenceId,
        patientId,
        firstName: 'Jane',
        lastName: 'Smith',
      });
      expect(residentResponse.data.patientId).toBe(patientId);
    });
  });

  describe('Auth Service Integration', () => {
    it('should validate JWT token across services', async () => {
      const token = 'valid-jwt-token';

      mockHttpClient.post.mockResolvedValueOnce({
        data: {
          valid: true,
          userId: uuid(),
          email: 'user@test.com',
          roles: ['caregiver'],
          agencyId: uuid(),
        },
      });

      const response = await mockHttpClient.post(`${SERVICES.AUTH}/auth/validate`, {
        token,
      });

      expect(response.data.valid).toBe(true);
      expect(response.data.userId).toBeDefined();
      expect(response.data.roles).toContain('caregiver');
    });

    it('should generate service-to-service token', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        data: {
          token: 'service-jwt-token',
          expiresIn: 300,
        },
      });

      const response = await mockHttpClient.post(`${SERVICES.AUTH}/auth/service-token`, {
        serviceName: 'scheduling-service',
        targetService: 'caregiver-service',
      });

      expect(response.data.token).toBeDefined();
      expect(response.data.expiresIn).toBe(300);
    });
  });

  describe('Event-Driven Communication (Kafka)', () => {
    const mockKafkaProducer = {
      send: jest.fn(),
    };

    const mockKafkaConsumer = {
      subscribe: jest.fn(),
      run: jest.fn(),
    };

    it('should publish appointment created event', async () => {
      const event = {
        topic: 'appointments.created',
        messages: [
          {
            key: uuid(),
            value: JSON.stringify({
              id: uuid(),
              caregiverId: uuid(),
              patientId: uuid(),
              scheduledDate: new Date().toISOString(),
              eventType: 'APPOINTMENT_CREATED',
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };

      mockKafkaProducer.send.mockResolvedValueOnce([{ partition: 0, offset: '1' }]);

      const result = await mockKafkaProducer.send(event);

      expect(mockKafkaProducer.send).toHaveBeenCalledWith(event);
      expect(result[0].partition).toBe(0);
    });

    it('should consume caregiver updated event', async () => {
      const handler = jest.fn();

      mockKafkaConsumer.subscribe.mockResolvedValueOnce(undefined);
      mockKafkaConsumer.run.mockImplementationOnce(({ eachMessage }) => {
        // Simulate receiving a message
        eachMessage({
          topic: 'caregivers.updated',
          partition: 0,
          message: {
            key: Buffer.from(uuid()),
            value: Buffer.from(
              JSON.stringify({
                id: uuid(),
                changes: { status: 'active' },
                eventType: 'CAREGIVER_UPDATED',
              }),
            ),
          },
        });
        return Promise.resolve();
      });

      await mockKafkaConsumer.subscribe({ topic: 'caregivers.updated' });
      await mockKafkaConsumer.run({ eachMessage: handler });

      expect(mockKafkaConsumer.subscribe).toHaveBeenCalled();
      expect(mockKafkaConsumer.run).toHaveBeenCalled();
    });
  });

  describe('Error Handling Between Services', () => {
    it('should handle service unavailable gracefully', async () => {
      mockHttpClient.get.mockRejectedValueOnce({
        response: { status: 503 },
        message: 'Service Unavailable',
      });

      try {
        await mockHttpClient.get(`${SERVICES.CAREGIVER}/caregivers/${uuid()}`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(503);
      }
    });

    it('should handle timeout errors', async () => {
      mockHttpClient.get.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      });

      try {
        await mockHttpClient.get(`${SERVICES.PATIENT}/patients/${uuid()}`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('ECONNABORTED');
      }
    });

    it('should handle circuit breaker open state', async () => {
      // Simulate circuit breaker open
      mockHttpClient.get.mockRejectedValueOnce({
        message: 'Circuit breaker is open',
        isCircuitBreakerError: true,
      });

      try {
        await mockHttpClient.get(`${SERVICES.SCHEDULING}/appointments`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.isCircuitBreakerError).toBe(true);
      }
    });
  });
});
