import { v4 as uuid } from 'uuid';

/**
 * Factory for generating test data
 */
export class Factory<T> {
  private defaults: () => Partial<T>;
  private sequence: number = 0;

  constructor(defaults: (sequence: number) => Partial<T>) {
    this.defaults = () => defaults(++this.sequence);
  }

  /**
   * Build a single entity
   */
  build(overrides: Partial<T> = {}): Partial<T> {
    return { ...this.defaults(), ...overrides };
  }

  /**
   * Build multiple entities
   */
  buildList(count: number, overrides: Partial<T> = {}): Partial<T>[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  /**
   * Reset the sequence counter
   */
  reset(): void {
    this.sequence = 0;
  }
}

// ============================================================================
// Common Factories
// ============================================================================

export const userFactory = new Factory((seq) => ({
  id: uuid(),
  email: `user${seq}@test.medi-aide.com`,
  firstName: `Test`,
  lastName: `User${seq}`,
  role: 'caregiver',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const agencyFactory = new Factory((seq) => ({
  id: uuid(),
  name: `Test Agency ${seq}`,
  code: `AGENCY${seq.toString().padStart(4, '0')}`,
  status: 'active',
  province: 'ON',
  email: `agency${seq}@test.medi-aide.com`,
  phone: `555-000-${seq.toString().padStart(4, '0')}`,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const caregiverFactory = new Factory((seq) => ({
  id: uuid(),
  userId: uuid(),
  agencyId: uuid(),
  employeeNumber: `CG${seq.toString().padStart(6, '0')}`,
  status: 'active',
  hourlyRate: 25.00 + (seq % 10),
  certifications: ['PSW'],
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const patientFactory = new Factory((seq) => ({
  id: uuid(),
  firstName: `Patient`,
  lastName: `Test${seq}`,
  dateOfBirth: new Date('1960-01-01'),
  healthCardNumber: `HCN${seq.toString().padStart(8, '0')}`,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const residenceFactory = new Factory((seq) => ({
  id: uuid(),
  agencyId: uuid(),
  name: `Test Residence ${seq}`,
  status: 'active',
  addressLine1: `${100 + seq} Test Street`,
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5V 3A8',
  capacity: 50,
  currentOccupancy: 25,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const jobPostingFactory = new Factory((seq) => ({
  id: uuid(),
  agencyId: uuid(),
  title: `Test Position ${seq}`,
  description: `Description for test position ${seq}`,
  jobType: 'full_time',
  status: 'active',
  positionsAvailable: 1,
  createdBy: uuid(),
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const contractFactory = new Factory((seq) => ({
  id: uuid(),
  contractNumber: `CTR${seq.toString().padStart(8, '0')}`,
  status: 'active',
  startDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}));

// ============================================================================
// Factory Registry
// ============================================================================

export const factories = {
  user: userFactory,
  agency: agencyFactory,
  caregiver: caregiverFactory,
  patient: patientFactory,
  residence: residenceFactory,
  jobPosting: jobPostingFactory,
  contract: contractFactory,
};

/**
 * Reset all factories
 */
export function resetAllFactories(): void {
  Object.values(factories).forEach((factory) => factory.reset());
}
