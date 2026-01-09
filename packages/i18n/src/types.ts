/**
 * Internationalization Types
 */

export type SupportedLocale = 'en-CA' | 'fr-CA' | 'en-US' | 'fr-FR';

export type TranslationNamespace =
  | 'common'
  | 'auth'
  | 'caregivers'
  | 'patients'
  | 'scheduling'
  | 'clinical'
  | 'billing'
  | 'errors'
  | 'notifications'
  | 'reports';

export interface TranslationKey {
  namespace: TranslationNamespace;
  key: string;
  params?: Record<string, string | number | Date>;
}

export interface LocaleConfig {
  locale: SupportedLocale;
  language: string;
  region: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  timezone: string;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  direction: 'ltr' | 'rtl';
}

export interface TranslationResource {
  [key: string]: string | TranslationResource;
}

export interface DateFormatOptions {
  format?: 'short' | 'medium' | 'long' | 'full';
  includeTime?: boolean;
  includeTimezone?: boolean;
}

export interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface I18nContext {
  locale: SupportedLocale;
  timezone: string;
  currency: string;
}

// Locale configurations
export const LOCALE_CONFIGS: Record<SupportedLocale, LocaleConfig> = {
  'en-CA': {
    locale: 'en-CA',
    language: 'en',
    region: 'CA',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'h:mm A',
    currency: 'CAD',
    timezone: 'America/Toronto',
    firstDayOfWeek: 0,
    direction: 'ltr',
  },
  'fr-CA': {
    locale: 'fr-CA',
    language: 'fr',
    region: 'CA',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    currency: 'CAD',
    timezone: 'America/Toronto',
    firstDayOfWeek: 1,
    direction: 'ltr',
  },
  'en-US': {
    locale: 'en-US',
    language: 'en',
    region: 'US',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    currency: 'USD',
    timezone: 'America/New_York',
    firstDayOfWeek: 0,
    direction: 'ltr',
  },
  'fr-FR': {
    locale: 'fr-FR',
    language: 'fr',
    region: 'FR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    firstDayOfWeek: 1,
    direction: 'ltr',
  },
};

// Default locale
export const DEFAULT_LOCALE: SupportedLocale = 'en-CA';

// Canadian provinces with bilingual support
export const CANADIAN_PROVINCES: Record<string, { en: string; fr: string }> = {
  AB: { en: 'Alberta', fr: 'Alberta' },
  BC: { en: 'British Columbia', fr: 'Colombie-Britannique' },
  MB: { en: 'Manitoba', fr: 'Manitoba' },
  NB: { en: 'New Brunswick', fr: 'Nouveau-Brunswick' },
  NL: { en: 'Newfoundland and Labrador', fr: 'Terre-Neuve-et-Labrador' },
  NS: { en: 'Nova Scotia', fr: 'Nouvelle-Écosse' },
  NT: { en: 'Northwest Territories', fr: 'Territoires du Nord-Ouest' },
  NU: { en: 'Nunavut', fr: 'Nunavut' },
  ON: { en: 'Ontario', fr: 'Ontario' },
  PE: { en: 'Prince Edward Island', fr: 'Île-du-Prince-Édouard' },
  QC: { en: 'Quebec', fr: 'Québec' },
  SK: { en: 'Saskatchewan', fr: 'Saskatchewan' },
  YT: { en: 'Yukon', fr: 'Yukon' },
};
