/**
 * Local Storage Module
 * IndexedDB-based storage for offline data
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MediAideDB extends DBSchema {
  shifts: {
    key: string;
    value: {
      id: string;
      patientId: string;
      patientName: string;
      startTime: string;
      endTime: string;
      status: string;
      clockInTime?: string;
      clockOutTime?: string;
      tasks: any[];
      notes: string;
      syncedAt?: number;
    };
    indexes: { 'by-date': string; 'by-status': string };
  };
  patients: {
    key: string;
    value: {
      id: string;
      firstName: string;
      lastName: string;
      address: any;
      phone: string;
      careNotes: string;
      medications: any[];
      allergies: string[];
      emergencyContacts: any[];
      syncedAt?: number;
    };
  };
  notes: {
    key: string;
    value: {
      id: string;
      shiftId: string;
      patientId: string;
      content: string;
      type: string;
      createdAt: string;
      syncedAt?: number;
    };
    indexes: { 'by-shift': string; 'by-patient': string };
  };
  vitals: {
    key: string;
    value: {
      id: string;
      patientId: string;
      type: string;
      value: number;
      unit: string;
      recordedAt: string;
      syncedAt?: number;
    };
    indexes: { 'by-patient': string; 'by-date': string };
  };
  medications: {
    key: string;
    value: {
      id: string;
      patientId: string;
      name: string;
      dosage: string;
      scheduledTime: string;
      administeredAt?: string;
      status: string;
      notes?: string;
      syncedAt?: number;
    };
    indexes: { 'by-patient': string; 'by-date': string };
  };
  tasks: {
    key: string;
    value: {
      id: string;
      shiftId: string;
      patientId: string;
      title: string;
      description?: string;
      status: string;
      completedAt?: string;
      syncedAt?: number;
    };
    indexes: { 'by-shift': string };
  };
  messages: {
    key: string;
    value: {
      id: string;
      conversationId: string;
      senderId: string;
      content: string;
      createdAt: string;
      read: boolean;
      syncedAt?: number;
    };
    indexes: { 'by-conversation': string };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: any;
      expiresAt: number;
    };
  };
}

const DB_NAME = 'medi-aide-mobile';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MediAideDB>> | null = null;

/**
 * Get database instance
 */
async function getDB(): Promise<IDBPDatabase<MediAideDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MediAideDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Shifts store
        const shiftStore = db.createObjectStore('shifts', { keyPath: 'id' });
        shiftStore.createIndex('by-date', 'startTime');
        shiftStore.createIndex('by-status', 'status');

        // Patients store
        db.createObjectStore('patients', { keyPath: 'id' });

        // Notes store
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('by-shift', 'shiftId');
        notesStore.createIndex('by-patient', 'patientId');

        // Vitals store
        const vitalsStore = db.createObjectStore('vitals', { keyPath: 'id' });
        vitalsStore.createIndex('by-patient', 'patientId');
        vitalsStore.createIndex('by-date', 'recordedAt');

        // Medications store
        const medsStore = db.createObjectStore('medications', { keyPath: 'id' });
        medsStore.createIndex('by-patient', 'patientId');
        medsStore.createIndex('by-date', 'scheduledTime');

        // Tasks store
        const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
        tasksStore.createIndex('by-shift', 'shiftId');

        // Messages store
        const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
        messagesStore.createIndex('by-conversation', 'conversationId');

        // Cache store
        db.createObjectStore('cache', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

/**
 * Local Storage Service
 */
export const LocalStorage = {
  // Shifts
  async saveShift(shift: MediAideDB['shifts']['value']): Promise<void> {
    const db = await getDB();
    await db.put('shifts', { ...shift, syncedAt: Date.now() });
  },

  async getShift(id: string): Promise<MediAideDB['shifts']['value'] | undefined> {
    const db = await getDB();
    return db.get('shifts', id);
  },

  async getShiftsByDate(date: string): Promise<MediAideDB['shifts']['value'][]> {
    const db = await getDB();
    return db.getAllFromIndex('shifts', 'by-date', IDBKeyRange.bound(
      `${date}T00:00:00`,
      `${date}T23:59:59`,
    ));
  },

  async getTodayShifts(): Promise<MediAideDB['shifts']['value'][]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getShiftsByDate(today);
  },

  async getUpcomingShifts(days: number = 7): Promise<MediAideDB['shifts']['value'][]> {
    const db = await getDB();
    const now = new Date().toISOString();
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    return db.getAllFromIndex('shifts', 'by-date', IDBKeyRange.bound(now, future));
  },

  // Patients
  async savePatient(patient: MediAideDB['patients']['value']): Promise<void> {
    const db = await getDB();
    await db.put('patients', { ...patient, syncedAt: Date.now() });
  },

  async getPatient(id: string): Promise<MediAideDB['patients']['value'] | undefined> {
    const db = await getDB();
    return db.get('patients', id);
  },

  async getAllPatients(): Promise<MediAideDB['patients']['value'][]> {
    const db = await getDB();
    return db.getAll('patients');
  },

  // Notes
  async saveNote(note: MediAideDB['notes']['value']): Promise<void> {
    const db = await getDB();
    await db.put('notes', { ...note, syncedAt: Date.now() });
  },

  async getNotesByShift(shiftId: string): Promise<MediAideDB['notes']['value'][]> {
    const db = await getDB();
    return db.getAllFromIndex('notes', 'by-shift', shiftId);
  },

  async getNotesByPatient(patientId: string): Promise<MediAideDB['notes']['value'][]> {
    const db = await getDB();
    return db.getAllFromIndex('notes', 'by-patient', patientId);
  },

  // Vitals
  async saveVital(vital: MediAideDB['vitals']['value']): Promise<void> {
    const db = await getDB();
    await db.put('vitals', { ...vital, syncedAt: Date.now() });
  },

  async getVitalsByPatient(patientId: string): Promise<MediAideDB['vitals']['value'][]> {
    const db = await getDB();
    return db.getAllFromIndex('vitals', 'by-patient', patientId);
  },

  // Medications
  async saveMedication(med: MediAideDB['medications']['value']): Promise<void> {
    const db = await getDB();
    await db.put('medications', { ...med, syncedAt: Date.now() });
  },

  async getMedicationsByPatient(patientId: string): Promise<MediAideDB['medications']['value'][]> {
    const db = await getDB();
    return db.getAllFromIndex('medications', 'by-patient', patientId);
  },

  async getTodayMedications(): Promise<MediAideDB['medications']['value'][]> {
    const db = await getDB();
    const today = new Date().toISOString().split('T')[0];
    return db.getAllFromIndex('medications', 'by-date', IDBKeyRange.bound(
      `${today}T00:00:00`,
      `${today}T23:59:59`,
    ));
  },

  // Tasks
  async saveTask(task: MediAideDB['tasks']['value']): Promise<void> {
    const db = await getDB();
    await db.put('tasks', { ...task, syncedAt: Date.now() });
  },

  async getTasksByShift(shiftId: string): Promise<MediAideDB['tasks']['value'][]> {
    const db = await getDB();
    return db.getAllFromIndex('tasks', 'by-shift', shiftId);
  },

  // Messages
  async saveMessage(message: MediAideDB['messages']['value']): Promise<void> {
    const db = await getDB();
    await db.put('messages', { ...message, syncedAt: Date.now() });
  },

  async getMessagesByConversation(conversationId: string): Promise<MediAideDB['messages']['value'][]> {
    const db = await getDB();
    return db.getAllFromIndex('messages', 'by-conversation', conversationId);
  },

  // Cache
  async setCache<T>(key: string, data: T, ttlMs: number = 3600000): Promise<void> {
    const db = await getDB();
    await db.put('cache', { key, data, expiresAt: Date.now() + ttlMs });
  },

  async getCache<T>(key: string): Promise<T | null> {
    const db = await getDB();
    const cached = await db.get('cache', key);
    if (!cached) return null;
    if (cached.expiresAt < Date.now()) {
      await db.delete('cache', key);
      return null;
    }
    return cached.data as T;
  },

  async clearCache(): Promise<void> {
    const db = await getDB();
    await db.clear('cache');
  },

  // Clear all data
  async clearAll(): Promise<void> {
    const db = await getDB();
    await Promise.all([
      db.clear('shifts'),
      db.clear('patients'),
      db.clear('notes'),
      db.clear('vitals'),
      db.clear('medications'),
      db.clear('tasks'),
      db.clear('messages'),
      db.clear('cache'),
    ]);
  },
};
