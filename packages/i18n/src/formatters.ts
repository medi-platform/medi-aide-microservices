/**
 * Locale-aware Formatters
 * Date, number, currency, and other formatters
 */

import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  format as formatDate,
  formatRelative,
  formatDistance,
  parseISO,
  isValid,
} from 'date-fns';
import { enCA, frCA, enUS, fr } from 'date-fns/locale';
import {
  SupportedLocale,
  DateFormatOptions,
  NumberFormatOptions,
  LOCALE_CONFIGS,
  DEFAULT_LOCALE,
  CANADIAN_PROVINCES,
} from './types';

// Date-fns locale mapping
const DATE_FNS_LOCALES = {
  'en-CA': enCA,
  'fr-CA': frCA,
  'en-US': enUS,
  'fr-FR': fr,
};

// Date format patterns
const DATE_PATTERNS: Record<SupportedLocale, Record<string, string>> = {
  'en-CA': {
    short: 'yyyy-MM-dd',
    medium: 'MMM d, yyyy',
    long: 'MMMM d, yyyy',
    full: 'EEEE, MMMM d, yyyy',
    shortTime: 'h:mm a',
    mediumTime: 'h:mm:ss a',
    longTime: 'h:mm:ss a z',
    shortDateTime: 'yyyy-MM-dd h:mm a',
    mediumDateTime: 'MMM d, yyyy h:mm a',
    longDateTime: 'MMMM d, yyyy h:mm:ss a',
  },
  'fr-CA': {
    short: 'yyyy-MM-dd',
    medium: 'd MMM yyyy',
    long: 'd MMMM yyyy',
    full: 'EEEE d MMMM yyyy',
    shortTime: 'HH:mm',
    mediumTime: 'HH:mm:ss',
    longTime: 'HH:mm:ss z',
    shortDateTime: 'yyyy-MM-dd HH:mm',
    mediumDateTime: 'd MMM yyyy HH:mm',
    longDateTime: 'd MMMM yyyy HH:mm:ss',
  },
  'en-US': {
    short: 'MM/dd/yyyy',
    medium: 'MMM d, yyyy',
    long: 'MMMM d, yyyy',
    full: 'EEEE, MMMM d, yyyy',
    shortTime: 'h:mm a',
    mediumTime: 'h:mm:ss a',
    longTime: 'h:mm:ss a z',
    shortDateTime: 'MM/dd/yyyy h:mm a',
    mediumDateTime: 'MMM d, yyyy h:mm a',
    longDateTime: 'MMMM d, yyyy h:mm:ss a',
  },
  'fr-FR': {
    short: 'dd/MM/yyyy',
    medium: 'd MMM yyyy',
    long: 'd MMMM yyyy',
    full: 'EEEE d MMMM yyyy',
    shortTime: 'HH:mm',
    mediumTime: 'HH:mm:ss',
    longTime: 'HH:mm:ss z',
    shortDateTime: 'dd/MM/yyyy HH:mm',
    mediumDateTime: 'd MMM yyyy HH:mm',
    longDateTime: 'd MMMM yyyy HH:mm:ss',
  },
};

@Injectable()
export class FormatterService {
  private locale: SupportedLocale;

  constructor(@Optional() @Inject('I18N_LOCALE') locale?: SupportedLocale) {
    this.locale = locale || DEFAULT_LOCALE;
  }

  /**
   * Set current locale
   */
  setLocale(locale: SupportedLocale): void {
    this.locale = locale;
  }

  /**
   * Format a date
   */
  formatDate(
    date: Date | string | number,
    options: DateFormatOptions = {},
  ): string {
    const parsedDate = this.parseDate(date);
    if (!parsedDate) return '';

    const { format: formatType = 'medium', includeTime = false } = options;

    let pattern: string;
    if (includeTime) {
      pattern = DATE_PATTERNS[this.locale][`${formatType}DateTime`] ||
        DATE_PATTERNS[this.locale].mediumDateTime;
    } else {
      pattern = DATE_PATTERNS[this.locale][formatType] ||
        DATE_PATTERNS[this.locale].medium;
    }

    return formatDate(parsedDate, pattern, {
      locale: DATE_FNS_LOCALES[this.locale],
    });
  }

  /**
   * Format time only
   */
  formatTime(
    date: Date | string | number,
    format: 'short' | 'medium' | 'long' = 'short',
  ): string {
    const parsedDate = this.parseDate(date);
    if (!parsedDate) return '';

    const pattern = DATE_PATTERNS[this.locale][`${format}Time`];
    return formatDate(parsedDate, pattern, {
      locale: DATE_FNS_LOCALES[this.locale],
    });
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date | string | number, baseDate?: Date): string {
    const parsedDate = this.parseDate(date);
    if (!parsedDate) return '';

    return formatDistance(parsedDate, baseDate || new Date(), {
      addSuffix: true,
      locale: DATE_FNS_LOCALES[this.locale],
    });
  }

  /**
   * Format relative date (e.g., "yesterday at 4:00 PM")
   */
  formatRelativeDate(date: Date | string | number, baseDate?: Date): string {
    const parsedDate = this.parseDate(date);
    if (!parsedDate) return '';

    return formatRelative(parsedDate, baseDate || new Date(), {
      locale: DATE_FNS_LOCALES[this.locale],
    });
  }

  /**
   * Format a number
   */
  formatNumber(
    value: number,
    options: NumberFormatOptions = {},
  ): string {
    const {
      style = 'decimal',
      currency = LOCALE_CONFIGS[this.locale].currency,
      minimumFractionDigits,
      maximumFractionDigits,
    } = options;

    const formatter = new Intl.NumberFormat(this.locale, {
      style,
      currency: style === 'currency' ? currency : undefined,
      minimumFractionDigits,
      maximumFractionDigits,
    });

    return formatter.format(value);
  }

  /**
   * Format currency
   */
  formatCurrency(value: number, currency?: string): string {
    return this.formatNumber(value, {
      style: 'currency',
      currency: currency || LOCALE_CONFIGS[this.locale].currency,
    });
  }

  /**
   * Format percentage
   */
  formatPercent(value: number, decimals: number = 0): string {
    return this.formatNumber(value / 100, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * Format phone number (Canadian format)
   */
  formatPhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    return phone;
  }

  /**
   * Format Canadian postal code
   */
  formatPostalCode(postalCode: string): string {
    const cleaned = postalCode.toUpperCase().replace(/\s/g, '');
    if (cleaned.length === 6) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    return postalCode;
  }

  /**
   * Format SIN (Social Insurance Number) - masked
   */
  formatSIN(sin: string, mask: boolean = true): string {
    const digits = sin.replace(/\D/g, '');
    if (digits.length !== 9) return sin;

    if (mask) {
      return `***-***-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  /**
   * Format health card number (province-specific)
   */
  formatHealthCard(number: string, province: string): string {
    const cleaned = number.replace(/\s/g, '').toUpperCase();

    switch (province) {
      case 'ON': // Ontario: 10 digits + 2 version digits
        if (cleaned.length === 12) {
          return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7, 10)}-${cleaned.slice(10)}`;
        }
        break;
      case 'QC': // Quebec: 4 letters + 8 digits
        if (cleaned.length === 12) {
          return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
        }
        break;
      case 'BC': // BC: 10 digits
        if (cleaned.length === 10) {
          return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
        }
        break;
      default:
        return number;
    }

    return number;
  }

  /**
   * Get province name
   */
  getProvinceName(code: string): string {
    const language = LOCALE_CONFIGS[this.locale].language;
    return CANADIAN_PROVINCES[code]?.[language as 'en' | 'fr'] || code;
  }

  /**
   * Format address (Canadian format)
   */
  formatAddress(address: {
    street: string;
    unit?: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
  }): string {
    const lines: string[] = [];

    // Line 1: Unit and street
    if (address.unit) {
      lines.push(`${address.unit}-${address.street}`);
    } else {
      lines.push(address.street);
    }

    // Line 2: City, Province Postal Code
    const provinceName = this.getProvinceName(address.province);
    lines.push(`${address.city}, ${provinceName} ${this.formatPostalCode(address.postalCode)}`);

    // Line 3: Country (if provided)
    if (address.country) {
      const countryName = address.country === 'CA'
        ? (this.locale.startsWith('fr') ? 'Canada' : 'Canada')
        : address.country;
      lines.push(countryName);
    }

    return lines.join('\n');
  }

  /**
   * Format duration in minutes to human-readable
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return this.locale.startsWith('fr')
        ? `${minutes} min`
        : `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (this.locale.startsWith('fr')) {
      if (mins === 0) {
        return `${hours} h`;
      }
      return `${hours} h ${mins} min`;
    } else {
      if (mins === 0) {
        return hours === 1 ? '1 hour' : `${hours} hours`;
      }
      const hourStr = hours === 1 ? '1 hour' : `${hours} hours`;
      return `${hourStr} ${mins} min`;
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${this.formatNumber(size, { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
  }

  /**
   * Parse date from various formats
   */
  private parseDate(date: Date | string | number): Date | null {
    if (date instanceof Date) {
      return isValid(date) ? date : null;
    }

    if (typeof date === 'number') {
      const parsed = new Date(date);
      return isValid(parsed) ? parsed : null;
    }

    if (typeof date === 'string') {
      const parsed = parseISO(date);
      return isValid(parsed) ? parsed : null;
    }

    return null;
  }
}
