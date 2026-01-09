import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';
import * as crypto from 'crypto';

/**
 * Field-Level Encryption Service
 * HIPAA-compliant encryption for PHI (Protected Health Information)
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>(
      'ENCRYPTION_KEY',
      'default-dev-key-change-in-production-32ch',
    );

    if (this.encryptionKey.length < 32) {
      this.logger.warn('Encryption key should be at least 32 characters');
    }
  }

  /**
   * Encrypt a string value
   */
  encrypt(plainText: string): string {
    if (!plainText) return plainText;

    try {
      const iv = crypto.randomBytes(16);
      const key = this.deriveKey();
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a string value
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = this.deriveKey();

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt an object's PHI fields
   */
  encryptPHIFields<T extends object>(obj: T, phiFields: string[]): T {
    const result = { ...obj } as any;

    for (const field of phiFields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.encrypt(result[field]);
      }
    }

    return result;
  }

  /**
   * Decrypt an object's PHI fields
   */
  decryptPHIFields<T extends object>(obj: T, phiFields: string[]): T {
    const result = { ...obj } as any;

    for (const field of phiFields) {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = this.decrypt(result[field]);
        } catch {
          // Field might not be encrypted (backward compatibility)
        }
      }
    }

    return result;
  }

  /**
   * Hash a value (one-way, for searching)
   */
  hash(value: string): string {
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(value)
      .digest('hex');
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Derive a 256-bit key from the encryption key
   */
  private deriveKey(): Buffer {
    return crypto.scryptSync(this.encryptionKey, 'salt', 32);
  }
}

/**
 * Decorator for encrypted entity fields
 */
export function Encrypted(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const existingEncryptedFields = Reflect.getMetadata('encrypted:fields', target) || [];
    Reflect.defineMetadata('encrypted:fields', [...existingEncryptedFields, propertyKey], target);
  };
}

/**
 * Get encrypted fields from an entity
 */
export function getEncryptedFields(target: any): string[] {
  return Reflect.getMetadata('encrypted:fields', target) || [];
}

/**
 * PHI Fields by entity type
 */
export const PHI_FIELDS: Record<string, string[]> = {
  Patient: [
    'firstName',
    'lastName',
    'dateOfBirth',
    'ssn',
    'healthCardNumber',
    'address',
    'phone',
    'email',
    'emergencyContact',
    'medicalHistory',
    'allergies',
    'medications',
  ],
  Caregiver: [
    'ssn',
    'sin',
    'bankAccountNumber',
    'driverLicenseNumber',
  ],
  ClinicalNote: [
    'content',
    'diagnosis',
    'treatment',
  ],
  VitalSigns: [
    'notes',
  ],
  Medication: [
    'notes',
  ],
};
