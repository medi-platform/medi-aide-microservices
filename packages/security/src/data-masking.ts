import { Injectable } from '@nestjs/common';

/**
 * Data Masking Service
 * Masks sensitive data for display and logs
 */
@Injectable()
export class DataMaskingService {
  /**
   * Mask email address
   * john.doe@example.com -> j***e@example.com
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;

    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  /**
   * Mask phone number
   * 555-123-4567 -> ***-***-4567
   */
  maskPhone(phone: string): string {
    if (!phone) return phone;

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '****';

    const lastFour = digits.slice(-4);
    return `***-***-${lastFour}`;
  }

  /**
   * Mask SSN/SIN
   * 123-45-6789 -> ***-**-6789
   */
  maskSSN(ssn: string): string {
    if (!ssn) return ssn;

    const digits = ssn.replace(/\D/g, '');
    if (digits.length < 4) return '***-**-****';

    const lastFour = digits.slice(-4);
    return `***-**-${lastFour}`;
  }

  /**
   * Mask credit card number
   * 4111111111111111 -> ****-****-****-1111
   */
  maskCreditCard(cardNumber: string): string {
    if (!cardNumber) return cardNumber;

    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 4) return '****';

    const lastFour = digits.slice(-4);
    return `****-****-****-${lastFour}`;
  }

  /**
   * Mask bank account number
   * 123456789 -> *****6789
   */
  maskBankAccount(account: string): string {
    if (!account) return account;

    const digits = account.replace(/\D/g, '');
    if (digits.length <= 4) return '****';

    const lastFour = digits.slice(-4);
    return '*'.repeat(digits.length - 4) + lastFour;
  }

  /**
   * Mask health card number
   * 1234-567-890-AB -> ****-***-***-AB
   */
  maskHealthCard(healthCard: string): string {
    if (!healthCard) return healthCard;

    // Keep last 2-3 characters visible
    if (healthCard.length <= 3) return '****';

    const visible = healthCard.slice(-2);
    return '****-***-***-' + visible;
  }

  /**
   * Mask name
   * John Doe -> J*** D**
   */
  maskName(name: string): string {
    if (!name) return name;

    return name
      .split(' ')
      .map((part) => {
        if (part.length <= 1) return part;
        return part[0] + '*'.repeat(part.length - 1);
      })
      .join(' ');
  }

  /**
   * Mask address
   * 123 Main Street -> *** M*** S*****
   */
  maskAddress(address: string): string {
    if (!address) return address;

    return address
      .split(' ')
      .map((part, index) => {
        // Mask numbers completely
        if (/^\d+$/.test(part)) return '***';
        // Keep first letter visible
        if (part.length <= 1) return part;
        return part[0] + '*'.repeat(part.length - 1);
      })
      .join(' ');
  }

  /**
   * Mask date of birth
   * 1990-05-15 -> ****-**-15
   */
  maskDateOfBirth(dob: string | Date): string {
    if (!dob) return '';

    const date = dob instanceof Date ? dob : new Date(dob);
    if (isNaN(date.getTime())) return '****-**-**';

    const day = date.getDate().toString().padStart(2, '0');
    return `****-**-${day}`;
  }

  /**
   * Mask IP address
   * 192.168.1.100 -> 192.168.***.**
   */
  maskIpAddress(ip: string): string {
    if (!ip) return ip;

    const parts = ip.split('.');
    if (parts.length !== 4) return ip;

    return `${parts[0]}.${parts[1]}.***.***`;
  }

  /**
   * Mask object fields
   */
  maskObject<T extends object>(
    obj: T,
    fieldMasks: Record<string, 'email' | 'phone' | 'ssn' | 'name' | 'address' | 'full'>,
  ): T {
    const result = { ...obj } as any;

    for (const [field, maskType] of Object.entries(fieldMasks)) {
      if (result[field] === undefined || result[field] === null) continue;

      switch (maskType) {
        case 'email':
          result[field] = this.maskEmail(result[field]);
          break;
        case 'phone':
          result[field] = this.maskPhone(result[field]);
          break;
        case 'ssn':
          result[field] = this.maskSSN(result[field]);
          break;
        case 'name':
          result[field] = this.maskName(result[field]);
          break;
        case 'address':
          result[field] = this.maskAddress(result[field]);
          break;
        case 'full':
          result[field] = '[REDACTED]';
          break;
      }
    }

    return result;
  }

  /**
   * Redact sensitive data from logs
   */
  redactForLogs(data: any): any {
    if (!data) return data;

    const sensitivePatterns = [
      { pattern: /"password":\s*"[^"]*"/gi, replacement: '"password": "[REDACTED]"' },
      { pattern: /"ssn":\s*"[^"]*"/gi, replacement: '"ssn": "[REDACTED]"' },
      { pattern: /"sin":\s*"[^"]*"/gi, replacement: '"sin": "[REDACTED]"' },
      { pattern: /"creditCard":\s*"[^"]*"/gi, replacement: '"creditCard": "[REDACTED]"' },
      { pattern: /"bankAccount":\s*"[^"]*"/gi, replacement: '"bankAccount": "[REDACTED]"' },
      { pattern: /"healthCardNumber":\s*"[^"]*"/gi, replacement: '"healthCardNumber": "[REDACTED]"' },
      { pattern: /"token":\s*"[^"]*"/gi, replacement: '"token": "[REDACTED]"' },
      { pattern: /"apiKey":\s*"[^"]*"/gi, replacement: '"apiKey": "[REDACTED]"' },
    ];

    let stringData = typeof data === 'string' ? data : JSON.stringify(data);

    for (const { pattern, replacement } of sensitivePatterns) {
      stringData = stringData.replace(pattern, replacement);
    }

    return typeof data === 'string' ? stringData : JSON.parse(stringData);
  }
}

/**
 * Masking presets for common entity types
 */
export const MASKING_PRESETS = {
  patient: {
    firstName: 'name',
    lastName: 'name',
    email: 'email',
    phone: 'phone',
    ssn: 'ssn',
    healthCardNumber: 'ssn',
    address: 'address',
    dateOfBirth: 'full',
  },
  caregiver: {
    ssn: 'ssn',
    sin: 'ssn',
    bankAccountNumber: 'full',
    driverLicenseNumber: 'full',
  },
  billing: {
    creditCardNumber: 'full',
    bankAccountNumber: 'full',
    routingNumber: 'full',
  },
} as const;
